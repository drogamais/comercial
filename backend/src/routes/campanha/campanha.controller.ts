import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../db/prismaClient.js'
import {
  adicionarUsuarioAoGrupo,
  removerUsuarioDoGrupo,
  PARCEIROS_CAMPANHA_GROUP_ID,
} from '../../services/embeddedApi.service.js'
import { config } from '../../config.js'

// GET /api/campanhas
export async function listCampanhas(req: FastifyRequest, reply: FastifyReply) {
  const campanhas = await prisma.campanha.findMany({
    include: { parceiro: { select: { id: true, nomeAjustado: true, nomeFantasia: true } } },
    orderBy: { dataInicio: 'desc' },
  })
  return reply.send(campanhas)
}

// GET /api/campanhas/:id
export async function getCampanha(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const campanha = await prisma.campanha.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { parceiro: { select: { id: true, nomeAjustado: true, nomeFantasia: true, emailGestor: true } } },
  })
  if (!campanha) return reply.code(404).send({ error: 'Campanha não encontrada' })
  return reply.send(campanha)
}

// POST /api/campanhas
export async function createCampanha(
  req: FastifyRequest<{
    Body: { nome: string; dataInicio: string; dataFim: string; status?: number; parceiroId?: number | null }
  }>,
  reply: FastifyReply
) {
  const { nome, dataInicio, dataFim, status, parceiroId } = req.body
  if (!nome || !dataInicio || !dataFim) {
    return reply.code(400).send({ error: 'nome, dataInicio e dataFim são obrigatórios' })
  }

  const campanha = await prisma.campanha.create({
    data: {
      nome,
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
      status: status ?? 1,
      parceiroId: parceiroId ?? null,
    },
  })

  // Vincular parceiro ao grupo de campanhas Embedded
  if (parceiroId) {
    const parceiro = await prisma.parceiro.findUnique({ where: { id: parceiroId } })
    if (parceiro?.emailGestor) {
      const [, err] = await adicionarUsuarioAoGrupo(parceiro.emailGestor, PARCEIROS_CAMPANHA_GROUP_ID)
      if (err) req.log.warn({ err }, 'Aviso: falha ao vincular parceiro ao grupo Embedded')
    }
  }

  return reply.code(201).send(campanha)
}

// PUT /api/campanhas/:id
export async function updateCampanha(
  req: FastifyRequest<{
    Params: { id: string }
    Body: { nome?: string; dataInicio?: string; dataFim?: string; status?: number; parceiroId?: number | null }
  }>,
  reply: FastifyReply
) {
  const id = parseInt(req.params.id)
  const old = await prisma.campanha.findUnique({
    where: { id },
    include: { parceiro: { select: { emailGestor: true } } },
  })
  if (!old) return reply.code(404).send({ error: 'Campanha não encontrada' })

  const { nome, dataInicio, dataFim, status, parceiroId } = req.body

  const data: any = {}
  if (nome !== undefined) data.nome = nome
  if (dataInicio !== undefined) data.dataInicio = new Date(dataInicio)
  if (dataFim !== undefined) data.dataFim = new Date(dataFim)
  if (status !== undefined) data.status = status
  if (parceiroId !== undefined) data.parceiroId = parceiroId ?? null

  if (Object.keys(data).length === 0) {
    return reply.send(old) // No changes to save
  }

  const updated = await prisma.campanha.update({
    where: { id },
    data,
  })

  // Gerir mudança de parceiro no grupo Embedded
  const oldParceiroId = old.parceiroId
  const newParceiroId = parceiroId !== undefined ? (parceiroId ?? null) : oldParceiroId

  if (oldParceiroId !== newParceiroId) {
    // Remover parceiro antigo do grupo
    if (old.parceiro?.emailGestor) {
      await removerUsuarioDoGrupo(old.parceiro.emailGestor, PARCEIROS_CAMPANHA_GROUP_ID)
    }
    // Adicionar novo parceiro
    if (newParceiroId) {
      const novoParceiro = await prisma.parceiro.findUnique({ where: { id: newParceiroId } })
      if (novoParceiro?.emailGestor) {
        const [, err] = await adicionarUsuarioAoGrupo(novoParceiro.emailGestor, PARCEIROS_CAMPANHA_GROUP_ID)
        if (err) req.log.warn({ err }, 'Aviso: falha ao vincular novo parceiro ao grupo Embedded')
      }
    }
  }

  return reply.send(updated)
}

// DELETE /api/campanhas/:id
export async function deleteCampanha(
  req: FastifyRequest<{ Params: { id: string }; Body: { senha: string } }>,
  reply: FastifyReply
) {
  if (req.body.senha !== config.DELETE_PASSWORD) {
    return reply.code(403).send({ error: 'Senha de confirmação incorreta' })
  }
  const id = parseInt(req.params.id)
  await prisma.campanha.delete({ where: { id } })
  return reply.send({ message: 'Campanha eliminada com sucesso' })
}

// POST /api/campanhas/:id/importar
export async function importCampanha(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const campanhaId = parseInt(req.params.id)
  const data = await req.file()
  if (!data) return reply.code(400).send({ error: 'Ficheiro não enviado' })

  const buffer = await data.toBuffer()
  const workbook = (await import('xlsx')).default.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = (await import('xlsx')).default.utils.sheet_to_json(sheet)

  if (rows.length === 0) return reply.code(400).send({ error: 'Planilha vazia' })

  // Mapeamento de colunas (Exemplo baseado no modelo CampanhaProduto)
  // O utilizador pode ajustar conforme necessário
  const produtos = rows.map((row: any) => ({
    campanhaId,
    codigoBarras: String(row['Código de Barras'] || row['EAN'] || row['codigoBarras'] || ''),
    codigoInterno: String(row['Código Interno'] || row['ID'] || row['codigoInterno'] || ''),
    descricao: String(row['Descrição'] || row['Produto'] || row['descricao'] || ''),
    precoNormal: row['Preço Normal'] || row['precoNormal'] || null,
    precoDesconto: row['Preço Desconto'] || row['precoDesconto'] || null,
    laboratorio: row['Laboratório'] || row['Fabricante'] || null,
    pontuacao: row['Pontuação'] || row['Pontos'] || null,
    rebaixe: row['Rebaixe'] || null,
    qtdLimite: row['Quantidade Limite'] || row['Estoque'] || null,
  }))

  // Inserção em massa (Prisma)
  await prisma.campanhaProduto.createMany({
    data: produtos,
    skipDuplicates: true,
  })

  return reply.send({ 
    message: 'Importação concluída com sucesso', 
    count: produtos.length 
  })
}
