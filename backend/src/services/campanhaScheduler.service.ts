import { prisma } from '../db/prismaClient.js'

/**
 * Finaliza automaticamente campanhas cuja dataFim já passou.
 * Roda a cada hora via setInterval iniciado no server.ts.
 */
export async function finalizarCampanhasExpiradas(): Promise<void> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const result = await prisma.campanha.updateMany({
    where: {
      status: 1,
      dataFim: { lt: hoje },
    },
    data: { status: 0 },
  })

  if (result.count > 0) {
    console.log(`[Scheduler] ${result.count} campanha(s) finalizada(s) automaticamente.`)
  }
}

export function iniciarSchedulerCampanhas(): void {
  // Roda imediatamente ao iniciar o servidor
  finalizarCampanhasExpiradas().catch(console.error)

  // Depois roda a cada hora
  setInterval(() => {
    finalizarCampanhasExpiradas().catch(console.error)
  }, 60 * 60 * 1000)
}
