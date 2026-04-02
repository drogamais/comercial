import type { FastifyInstance } from 'fastify'
import {
  listParceiros,
  listNomesAjustados,
  createParceiro,
  updateParceiro,
  deleteParceiro,
  setPassword,
  downloadContrato,
  exportParceiros,
} from './parceiro.controller.js'

export async function parceiroRoutes(fastify: FastifyInstance) {
  // A rota /nomes-ajustados e /export devem ser declaradas antes de /:id
  fastify.get('/nomes-ajustados', listNomesAjustados)
  fastify.get('/export', exportParceiros)
  fastify.get('/', listParceiros)
  fastify.post('/', createParceiro)
  fastify.put('/:id', updateParceiro)
  fastify.delete('/:id', deleteParceiro)
  fastify.post('/:id/set-password', setPassword)
  fastify.get('/:id/contrato', downloadContrato)
}
