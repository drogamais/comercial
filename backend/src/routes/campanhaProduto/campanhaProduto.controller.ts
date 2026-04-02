import type { FastifyRequest, FastifyReply } from 'fastify'
import type { MultipartFile } from '@fastify/multipart'
import { prisma } from '../../db/prismaClient.js'
import { validateGtins, getCodigoInternoMap } from '../../db/externalDbClient.js'
import { parseCampanhaExcel, parseTabloidExcel, exportToExcel } from '../../services/excelProcessor.service.js'
import { padBarcode } from '../../utils/barcode.js'
import { config } from '../../config.js'

// GET /api/campanhas/:id/produtos
export async function listProdutos(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const produtos = await prisma.campanhaProduto.findMany({
    where: { campanhaId: parseInt(req.params.id) },
    orderBy: { id: 'asc' },
  })
  return reply.send(produtos)
}

// POST /api/campanhas/:id/produtos (adicionar 1 produto manualmente)
export async function addProduto(
  req: FastifyRequest<{
    Params: { id: string }
    Body: Record<string, unknown>
  }>,
  reply: FastifyReply
) {
  const campanhaId = parseInt(req.params.id)
  const b = req.body

  const codigoBarrasNormalizado = padBarcode(b.codigoBarras)
  let codigoInterno = (b.codigoInterno as string | null) ?? null
  if (!codigoInterno && codigoBarrasNormalizado) {
    const ciMap = await getCodigoInternoMap([codigoBarrasNormalizado])
    codigoInterno = ciMap[codigoBarrasNormalizado] ?? null
  }

  const produto = await prisma.campanhaProduto.create({
    data: {
      campanhaId,
      codigoBarras: (b.codigoBarras as string) ?? null,
      codigoBarrasNormalizado,
      codigoInterno,
      descricao: (b.descricao as string) ?? null,
      precoNormal: b.precoNormal != null ? parseFloat(String(b.precoNormal)) : null,
      precoDesconto: b.precoDesconto != null ? parseFloat(String(b.precoDesconto)) : null,
      laboratorio: (b.laboratorio as string) ?? null,
      tipoPreco: (b.tipoPreco as string) ?? null,
      precoDescontoCliente: b.precoDescontoCliente != null ? parseFloat(String(b.precoDescontoCliente)) : null,
      precoApp: b.precoApp != null ? parseFloat(String(b.precoApp)) : null,
      tipoRegra: (b.tipoRegra as string) ?? null,
      pontuacao: b.pontuacao != null ? parseInt(String(b.pontuacao)) : null,
      rebaixe: b.rebaixe != null ? parseFloat(String(b.rebaixe)) : null,
      qtdLimite: b.qtdLimite != null ? parseInt(String(b.qtdLimite)) : null,
    },
  })
  return reply.code(201).send(produto)
}

// PATCH /api/campanhas/:id/produtos (atualizar vários produtos)
export async function updateProdutos(
  req: FastifyRequest<{
    Params: { id: string }
    Body: { produtos: Array<{ id: number } & Record<string, unknown>> }
  }>,
  reply: FastifyReply
) {
  const updates = req.body.produtos ?? []
  const results = await Promise.all(
    updates.map(async ({ id, ...data }) => {
      const codigoBarrasNormalizado = padBarcode(data.codigoBarras)
      let codigoInterno = (data.codigoInterno as string | null) ?? null
      if (!codigoInterno && codigoBarrasNormalizado) {
        const ciMap = await getCodigoInternoMap([codigoBarrasNormalizado])
        codigoInterno = ciMap[codigoBarrasNormalizado] ?? null
      }
      return prisma.campanhaProduto.update({
        where: { id },
        data: {
          codigoBarras: (data.codigoBarras as string) ?? null,
          codigoBarrasNormalizado,
          codigoInterno,
          descricao: (data.descricao as string) ?? null,
          precoNormal: data.precoNormal != null ? parseFloat(String(data.precoNormal)) : null,
          precoDesconto: data.precoDesconto != null ? parseFloat(String(data.precoDesconto)) : null,
          laboratorio: (data.laboratorio as string) ?? null,
          tipoPreco: (data.tipoPreco as string) ?? null,
          precoDescontoCliente: data.precoDescontoCliente != null ? parseFloat(String(data.precoDescontoCliente)) : null,
          precoApp: data.precoApp != null ? parseFloat(String(data.precoApp)) : null,
          tipoRegra: (data.tipoRegra as string) ?? null,
          pontuacao: data.pontuacao != null ? parseInt(String(data.pontuacao)) : null,
          rebaixe: data.rebaixe != null ? parseFloat(String(data.rebaixe)) : null,
          qtdLimite: data.qtdLimite != null ? parseInt(String(data.qtdLimite)) : null,
        },
      })
    })
  )
  return reply.send({ updated: results.length })
}

// DELETE /api/campanhas/:id/produtos (eliminar vários produtos)
export async function deleteProdutos(
  req: FastifyRequest<{ Params: { id: string }; Body: { ids: number[]; senha: string } }>,
  reply: FastifyReply
) {
  if (req.body.senha !== config.DELETE_PASSWORD) {
    return reply.code(403).send({ error: 'Senha de confirmação incorreta' })
  }
  const { count } = await prisma.campanhaProduto.deleteMany({
    where: { id: { in: req.body.ids }, campanhaId: parseInt(req.params.id) },
  })
  return reply.send({ deleted: count })
}

// POST /api/campanhas/:id/produtos/upload (upload Excel)
export async function uploadProdutos(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const campanhaId = parseInt(req.params.id)
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } })
  if (!campanha) return reply.code(404).send({ error: 'Campanha não encontrada' })

  const data = await req.file()
  if (!data) return reply.code(400).send({ error: 'Ficheiro em falta' })

  const ext = data.filename.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls'].includes(ext ?? '')) {
    return reply.code(400).send({ error: 'Formato inválido. Use .xlsx ou .xls' })
  }

  const buffer = await data.toBuffer()

  // Escolhe o parser com base na presença de parceiro (tabloide vs campanha)
  const rows = campanha.parceiroId
    ? await parseCampanhaExcel(buffer)
    : await parseTabloidExcel(buffer)

  // Substitui todos os produtos da campanha
  await prisma.campanhaProduto.deleteMany({ where: { campanhaId } })
  await prisma.campanhaProduto.createMany({
    data: rows.map((r) => ({ ...r, campanhaId })),
  })

  return reply.send({ inserted: rows.length })
}

// POST /api/campanhas/:id/produtos/validate-gtins (AJAX validação GTIN)
export async function validateGtinsRoute(
  req: FastifyRequest<{
    Params: { id: string }
    Body: { products: Array<{ id: number; gtin: string }> }
  }>,
  reply: FastifyReply
) {
  const items = req.body.products ?? []
  const gtinList = items.map((p) => padBarcode(p.gtin)).filter(Boolean) as string[]

  const validSet = await validateGtins(gtinList)
  const ciMap = await getCodigoInternoMap(gtinList)

  // Actualiza código interno nos produtos que têm GTIN válido
  let updatedCount = 0
  await Promise.all(
    items.map(async ({ id, gtin }) => {
      const norm = padBarcode(gtin)
      if (norm && validSet.has(norm)) {
        const ci = ciMap[norm] ?? null
        await prisma.campanhaProduto.update({ where: { id }, data: { codigoInterno: ci } })
        updatedCount++
      }
    })
  )

  return reply.send({ validGtins: Array.from(validSet), updatedCount })
}

// GET /api/campanhas/:id/produtos/export
export async function exportProdutos(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const campanhaId = parseInt(req.params.id)
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } })
  if (!campanha) return reply.code(404).send({ error: 'Campanha não encontrada' })

  const produtos = await prisma.campanhaProduto.findMany({ where: { campanhaId }, orderBy: { id: 'asc' } })

  const rows = produtos.map((p) => ({
    'Código de Barras': p.codigoBarras,
    'GTIN Normalizado': p.codigoBarrasNormalizado,
    'Código Interno': p.codigoInterno,
    Descrição: p.descricao,
    Laboratório: p.laboratorio,
    'Tipo de Preço': p.tipoPreco,
    'Preço Normal': p.precoNormal ? Number(p.precoNormal) : null,
    'Preço Desconto': p.precoDesconto ? Number(p.precoDesconto) : null,
    'Preço Desconto Cliente': p.precoDescontoCliente ? Number(p.precoDescontoCliente) : null,
    'Preço App': p.precoApp ? Number(p.precoApp) : null,
    'Tipo de Regra': p.tipoRegra,
    Pontuação: p.pontuacao,
    Rebaixe: p.rebaixe ? Number(p.rebaixe) : null,
    'Qtd Limite': p.qtdLimite,
  }))

  const buffer = exportToExcel(rows, 'Produtos')
  const filename = `export_produtos_campanha_${campanha.nome.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
  return reply
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .send(buffer)
}
