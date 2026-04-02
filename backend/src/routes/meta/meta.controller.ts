import type { FastifyRequest, FastifyReply } from 'fastify'
import * as XLSX from 'xlsx'
import {
  getParceiros,
  listMetasSummary,
  getMetasDetalhe,
  salvarMetas,
  type MetaInsertRow,
} from '../../db/externalDbClient.js'
import { exportToExcel } from '../../services/excelProcessor.service.js'

// GET /api/metas/parceiros
export async function listParceirosExternos(_req: FastifyRequest, reply: FastifyReply) {
  const parceiros = await getParceiros()
  return reply.send(parceiros)
}

// GET /api/metas/resumo
export async function listMetasResumo(_req: FastifyRequest, reply: FastifyReply) {
  const resumo = await listMetasSummary()
  return reply.send(resumo)
}

// GET /api/metas/modelo
export async function downloadModelo(_req: FastifyRequest, reply: FastifyReply) {
  const template = [{ EAN: '7891234567890', VALOR_META: 1500.0, QUANTIDADE: 10, REPASSE: 1.5 }]
  const buffer = exportToExcel(template as Record<string, unknown>[], 'Modelo')
  reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  reply.header('Content-Disposition', 'attachment; filename="modelo_metas.xlsx"')
  return reply.send(buffer)
}

// POST /api/metas/importar?id_parceiro=X&mes=YYYY-MM
export async function importarMetas(
  req: FastifyRequest<{ Querystring: { id_parceiro?: string; mes?: string } }>,
  reply: FastifyReply
) {
  const idParceiro = parseInt(req.query.id_parceiro ?? '')
  const mes = req.query.mes ?? ''

  if (isNaN(idParceiro) || !mes) {
    return reply.code(400).send({ error: 'Parâmetros id_parceiro e mes são obrigatórios' })
  }

  const mesReferencia = `${mes}-01`

  const data = await req.file()
  if (!data) return reply.code(400).send({ error: 'Ficheiro não enviado' })

  const buffer = await data.toBuffer()
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: null })

  if (rawRows.length === 0) return reply.code(400).send({ error: 'Planilha vazia' })

  const required = ['EAN', 'VALOR_META', 'QUANTIDADE', 'REPASSE']
  const firstRow = rawRows[0]
  const missing = required.filter((col) => !(col in firstRow))
  if (missing.length > 0) {
    return reply.code(400).send({ error: `Colunas ausentes: ${missing.join(', ')}` })
  }

  const rows: MetaInsertRow[] = rawRows.map((r) => {
    const ean = String(r['EAN'] ?? '').trim()
    const valorMeta = parseFloat(String(r['VALOR_META'] ?? '0').replace(',', '.')) || 0
    const quantidade = parseInt(String(r['QUANTIDADE'] ?? '0'), 10) || 0
    const repasse = parseFloat(String(r['REPASSE'] ?? '0').replace(',', '.')) || 0
    return {
      id_parceiro: idParceiro,
      mes_referencia: mesReferencia,
      tipo_meta: 'PRODUTO',
      ean_produto: ean,
      valor_meta: valorMeta,
      quantidade,
      repasse,
      operador: '',
      texto_bi: `Produto ${ean} - Repasse ${repasse.toFixed(2).replace('.', ',')}%`,
    }
  })

  const count = await salvarMetas(idParceiro, mesReferencia, rows)
  return reply.send({ count })
}

// GET /api/metas?id_parceiro=X&mes=YYYY-MM
export async function listMetas(
  req: FastifyRequest<{ Querystring: { id_parceiro?: string; mes?: string } }>,
  reply: FastifyReply
) {
  const idParceiro = parseInt(req.query.id_parceiro ?? '')
  const mes = req.query.mes ?? ''

  if (isNaN(idParceiro) || !mes) {
    return reply.code(400).send({ error: 'Parâmetros id_parceiro e mes são obrigatórios' })
  }

  const mesReferencia = `${mes}-01`
  const all = await getMetasDetalhe(idParceiro, mesReferencia)

  const produtos = all.filter((r) => r.tipo_meta === 'PRODUTO')
  const condicionais = all.filter((r) => r.tipo_meta !== 'PRODUTO')

  return reply.send({ produtos, condicionais })
}

// POST /api/metas
export async function saveMetas(
  req: FastifyRequest<{
    Body: { id_parceiro: number; mes_referencia: string; rows: MetaInsertRow[] }
  }>,
  reply: FastifyReply
) {
  const { id_parceiro, mes_referencia, rows } = req.body

  if (!id_parceiro || !mes_referencia || !Array.isArray(rows)) {
    return reply.code(400).send({ error: 'Dados inválidos' })
  }

  const rowsWithKey = rows.map((r) => ({ ...r, id_parceiro, mes_referencia }))
  const count = await salvarMetas(id_parceiro, mes_referencia, rowsWithKey)
  return reply.send({ count })
}
