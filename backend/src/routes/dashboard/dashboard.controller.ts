import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../db/prismaClient.js'

export async function getDashboardSummary(request: FastifyRequest, reply: FastifyReply) {
  // Use CURDATE() nativo do MariaDB — evita qualquer ambiguidade de timezone
  // entre JS Date e colunas DATE do MariaDB
  const activeCampaigns = await prisma.$queryRaw<any[]>`
    SELECT
      c.id,
      c.nome,
      c.data_inicio  AS dataInicio,
      c.data_fim     AS dataFim,
      c.status,
      c.parceiro_id  AS parceiroId,
      p.id           AS parceiro_id,
      p.nome_ajustado AS parceiro_nomeAjustado,
      p.nome_fantasia AS parceiro_nomeFantasia,
      (SELECT COUNT(*) FROM dim_campanha_produto cp WHERE cp.campanha_id = c.id) AS produtosCount
    FROM dim_campanha c
    LEFT JOIN dim_parceiros p ON p.id = c.parceiro_id
    WHERE c.status = 1
      AND c.data_inicio <= CURDATE()
      AND c.data_fim    >= CURDATE()
    ORDER BY c.data_fim ASC
  `

  // Mapear para o formato esperado pelo frontend
  const campaigns = activeCampaigns.map((c: any) => ({
    id: c.id,
    nome: c.nome,
    dataInicio: c.dataInicio,
    dataFim: c.dataFim,
    status: c.status,
    parceiroId: c.parceiroId,
    parceiro: c.parceiro_id ? {
      id: c.parceiro_id,
      nomeAjustado: c.parceiro_nomeAjustado,
      nomeFantasia: c.parceiro_nomeFantasia,
    } : null,
    _count: { produtos: Number(c.produtosCount) },
  }))

  // Parceiros com contrato a vencer nos próximos 30 dias
  const expiringPartners = await prisma.$queryRaw<any[]>`
    SELECT id, nome_ajustado AS nomeAjustado, nome_fantasia AS nomeFantasia, data_saida AS dataSaida
    FROM dim_parceiros
    WHERE status = 1
      AND data_saida >= CURDATE()
      AND data_saida <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    ORDER BY data_saida ASC
  `

  return reply.send({
    activeCampaigns: campaigns,
    expiringPartners,
    stats: {
      totalActiveCampaigns: campaigns.length,
      totalExpiringPartners: expiringPartners.length,
    },
  })
}
