import type { FastifyInstance } from 'fastify'
import {
  listProdutos,
  addProduto,
  updateProdutos,
  deleteProdutos,
  uploadProdutos,
  validateGtinsRoute,
  exportProdutos,
} from './campanhaProduto.controller.js'

export async function campanhaProdutoRoutes(fastify: FastifyInstance) {
  fastify.get('/:id/produtos', listProdutos)
  fastify.post('/:id/produtos', addProduto)
  fastify.patch('/:id/produtos', updateProdutos)
  fastify.delete('/:id/produtos', deleteProdutos)
  fastify.post('/:id/produtos/upload', uploadProdutos)
  fastify.post('/:id/produtos/validate-gtins', validateGtinsRoute)
  fastify.get('/:id/produtos/export', exportProdutos)
}
