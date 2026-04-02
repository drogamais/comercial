import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../db/prismaClient.js'
import { getNomesAjustados } from '../../db/externalDbClient.js'
import {
  criarParceiroCompleto,
  atualizarUsuario,
  deletarUsuario,
  definirSenhaUsuario,
} from '../../services/embeddedApi.service.js'
import { saveContract, deleteContract, getContractPath } from '../../services/fileStorage.service.js'
import { exportToExcel } from '../../services/excelProcessor.service.js'
import { config } from '../../config.js'
import { createReadStream } from 'fs'
import { addDays } from '../../utils/date.js'

// GET /api/parceiros
export async function listParceiros(
  req: FastifyRequest<{
    Querystring: {
      tipo?: string
      nomeFantasia?: string
      dataEntradaMin?: string
      dataSaidaMax?: string
      expirandoEm?: string
    }
  }>,
  reply: FastifyReply
) {
  const { tipo, nomeFantasia, dataEntradaMin, dataSaidaMax, expirandoEm } = req.query

  const parceiros = await prisma.parceiro.findMany({
    where: {
      status: 1,
      ...(tipo && { tipo: tipo as 'INDUSTRIA' | 'DISTRIBUIDOR' }),
      ...(nomeFantasia && { nomeFantasia: { contains: nomeFantasia } }),
      ...(dataEntradaMin && { dataEntrada: { gte: new Date(dataEntradaMin) } }),
      ...(dataSaidaMax && { dataSaida: { lte: new Date(dataSaidaMax) } }),
      ...(expirandoEm && {
        dataSaida: { gte: new Date(), lte: addDays(new Date(), parseInt(expirandoEm)) },
      }),
    },
    orderBy: { nomeAjustado: 'asc' },
  })
  return reply.send(parceiros)
}

// GET /api/parceiros/nomes-ajustados
export async function listNomesAjustados(_req: FastifyRequest, reply: FastifyReply) {
  const nomes = await getNomesAjustados()
  return reply.send(nomes)
}

// POST /api/parceiros
export async function createParceiro(req: FastifyRequest, reply: FastifyReply) {
  const parts = req.parts()
  const fields: Record<string, string> = {}
  let contractBuffer: Buffer | null = null
  let contractOriginalName: string | null = null

  for await (const part of parts) {
    if (part.type === 'file') {
      contractBuffer = await part.toBuffer()
      contractOriginalName = part.filename
    } else {
      fields[part.fieldname] = part.value as string
    }
  }

  const { nomeAjustado, tipo, cnpj, nomeFantasia, razaoSocial, gestor, telefoneGestor, emailGestor, dataEntrada, dataSaida } = fields

  if (!nomeAjustado || !emailGestor) {
    return reply.code(400).send({ error: 'nomeAjustado e emailGestor são obrigatórios' })
  }

  // Guardar contrato PDF
  let contratoArquivo: string | null = null
  if (contractBuffer && contractOriginalName?.toLowerCase().endsWith('.pdf') && nomeFantasia) {
    contratoArquivo = await saveContract(contractBuffer, nomeFantasia)
  }

  // Criar na API Embedded
  const parceiroData = { emailGestor, nomeFantasia: nomeFantasia ?? null, tipo: tipo ?? null, dataSaida: dataSaida ?? null }
  const [apiUserId, erroApi] = await criarParceiroCompleto(parceiroData)
  if (erroApi) {
    if (contratoArquivo) await deleteContract(contratoArquivo)
    return reply.code(502).send({ error: erroApi })
  }

  const parceiro = await prisma.parceiro.create({
    data: {
      apiUserId,
      nomeAjustado,
      tipo: (tipo as 'INDUSTRIA' | 'DISTRIBUIDOR') ?? null,
      cnpj: cnpj ?? null,
      nomeFantasia: nomeFantasia ?? null,
      razaoSocial: razaoSocial ?? null,
      gestor: gestor ?? null,
      telefoneGestor: telefoneGestor ?? null,
      emailGestor,
      dataEntrada: dataEntrada ? new Date(dataEntrada) : null,
      dataSaida: dataSaida ? new Date(dataSaida) : null,
      contratoArquivo,
    },
  })

  return reply.code(201).send(parceiro)
}

// PUT /api/parceiros/:id
export async function updateParceiro(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = parseInt(req.params.id)
  const existing = await prisma.parceiro.findUnique({ where: { id } })
  if (!existing) return reply.code(404).send({ error: 'Parceiro não encontrado' })

  const parts = req.parts()
  const fields: Record<string, string> = {}
  let contractBuffer: Buffer | null = null
  let contractOriginalName: string | null = null

  for await (const part of parts) {
    if (part.type === 'file') {
      contractBuffer = await part.toBuffer()
      contractOriginalName = part.filename
    } else {
      fields[part.fieldname] = part.value as string
    }
  }

  const removerContrato = fields.removerContrato === 'true'

  // Gestão do ficheiro de contrato
  let contratoArquivo = existing.contratoArquivo
  if (removerContrato) {
    await deleteContract(existing.contratoArquivo)
    contratoArquivo = null
  } else if (contractBuffer && contractOriginalName?.toLowerCase().endsWith('.pdf')) {
    await deleteContract(existing.contratoArquivo)
    contratoArquivo = await saveContract(contractBuffer, fields.nomeFantasia ?? existing.nomeFantasia ?? 'parceiro')
  }

  // Actualizar na API (emailGestor não pode mudar)
  const parceiroData = {
    emailGestor: existing.emailGestor,
    nomeFantasia: fields.nomeFantasia ?? existing.nomeFantasia,
    tipo: fields.tipo ?? existing.tipo,
    dataSaida: fields.dataSaida ?? existing.dataSaida,
    apiUserId: existing.apiUserId,
  }
  const [, erroApi] = await atualizarUsuario(existing.apiUserId, parceiroData)
  if (erroApi) req.log.warn({ erroApi }, 'Aviso: falha ao actualizar utilizador na API Embedded')

  const updated = await prisma.parceiro.update({
    where: { id },
    data: {
      nomeAjustado: fields.nomeAjustado ?? existing.nomeAjustado,
      tipo: (fields.tipo as 'INDUSTRIA' | 'DISTRIBUIDOR') ?? existing.tipo,
      cnpj: fields.cnpj ?? existing.cnpj,
      nomeFantasia: fields.nomeFantasia ?? existing.nomeFantasia,
      razaoSocial: fields.razaoSocial ?? existing.razaoSocial,
      gestor: fields.gestor ?? existing.gestor,
      telefoneGestor: fields.telefoneGestor ?? existing.telefoneGestor,
      dataEntrada: fields.dataEntrada ? new Date(fields.dataEntrada) : existing.dataEntrada,
      dataSaida: fields.dataSaida ? new Date(fields.dataSaida) : existing.dataSaida,
      contratoArquivo,
    },
  })

  return reply.send(updated)
}

// DELETE /api/parceiros/:id
export async function deleteParceiro(
  req: FastifyRequest<{ Params: { id: string }; Body: { senha: string } }>,
  reply: FastifyReply
) {
  if (req.body.senha !== config.DELETE_PASSWORD) {
    return reply.code(403).send({ error: 'Senha de confirmação incorreta' })
  }
  const id = parseInt(req.params.id)
  const parceiro = await prisma.parceiro.findUnique({ where: { id } })
  if (!parceiro) return reply.code(404).send({ error: 'Parceiro não encontrado' })

  const [, erroApi] = await deletarUsuario(parceiro.emailGestor)
  if (erroApi) req.log.warn({ erroApi }, 'Aviso: falha ao eliminar utilizador na API Embedded')

  await deleteContract(parceiro.contratoArquivo)
  await prisma.parceiro.delete({ where: { id } })

  return reply.send({ message: 'Parceiro eliminado com sucesso' })
}

// POST /api/parceiros/:id/set-password
export async function setPassword(
  req: FastifyRequest<{ Params: { id: string }; Body: { novaSenha: string; confirmarSenha: string } }>,
  reply: FastifyReply
) {
  const { novaSenha, confirmarSenha } = req.body
  if (!novaSenha || novaSenha !== confirmarSenha) {
    return reply.code(400).send({ error: 'As senhas não coincidem ou estão em falta' })
  }

  const id = parseInt(req.params.id)
  const parceiro = await prisma.parceiro.findUnique({ where: { id } })
  if (!parceiro) return reply.code(404).send({ error: 'Parceiro não encontrado' })
  if (!parceiro.emailGestor) return reply.code(400).send({ error: 'Parceiro sem email gestor' })

  const [ok, erro] = await definirSenhaUsuario(parceiro.emailGestor, novaSenha)
  if (!ok) return reply.code(502).send({ error: erro })

  await prisma.parceiro.update({ where: { id }, data: { senhaDefinida: true } })
  return reply.send({ message: 'Senha definida com sucesso' })
}

// GET /api/parceiros/:id/contrato
export async function downloadContrato(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = parseInt(req.params.id)
  const parceiro = await prisma.parceiro.findUnique({ where: { id } })
  if (!parceiro?.contratoArquivo) return reply.code(404).send({ error: 'Contrato não encontrado' })

  const filePath = getContractPath(parceiro.contratoArquivo)
  return reply
    .header('Content-Disposition', `attachment; filename="${parceiro.contratoArquivo}"`)
    .type('application/pdf')
    .send(createReadStream(filePath))
}

// GET /api/parceiros/export
export async function exportParceiros(
  req: FastifyRequest<{
    Querystring: { tipo?: string; nomeFantasia?: string; dataEntradaMin?: string; dataSaidaMax?: string }
  }>,
  reply: FastifyReply
) {
  const { tipo, nomeFantasia, dataEntradaMin, dataSaidaMax } = req.query

  const parceiros = await prisma.parceiro.findMany({
    where: {
      status: 1,
      ...(tipo && { tipo: tipo as 'INDUSTRIA' | 'DISTRIBUIDOR' }),
      ...(nomeFantasia && { nomeFantasia: { contains: nomeFantasia } }),
      ...(dataEntradaMin && { dataEntrada: { gte: new Date(dataEntradaMin) } }),
      ...(dataSaidaMax && { dataSaida: { lte: new Date(dataSaidaMax) } }),
    },
    orderBy: { nomeAjustado: 'asc' },
  })

  const rows = parceiros.map((p) => ({
    Tipo: p.tipo,
    'Nome Ajustado': p.nomeAjustado,
    CNPJ: p.cnpj,
    'Nome Fantasia': p.nomeFantasia,
    'Razão Social': p.razaoSocial,
    Gestor: p.gestor,
    'Telefone Gestor': p.telefoneGestor,
    'E-mail Gestor': p.emailGestor,
    'Data Entrada': p.dataEntrada?.toISOString().split('T')[0] ?? null,
    'Data Saída': p.dataSaida?.toISOString().split('T')[0] ?? null,
    'Senha Definida': p.senhaDefinida ? 'Sim' : 'Não',
  }))

  const buffer = exportToExcel(rows, 'Parceiros')
  return reply
    .header('Content-Disposition', 'attachment; filename="export_parceiros.xlsx"')
    .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .send(buffer)
}
