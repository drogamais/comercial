import type { FastifyInstance } from 'fastify'
import {
  listCampanhas,
  getCampanha,
  createCampanha,
  updateCampanha,
  deleteCampanha,
  importCampanha,
} from './campanha.controller.js'
import path from 'path'
import { createReadStream } from 'fs'

export async function campanhaRoutes(fastify: FastifyInstance) {
  fastify.get('/', listCampanhas)
  fastify.get('/:id', getCampanha)
  fastify.post('/', createCampanha)
  fastify.put('/:id', updateCampanha)
  fastify.delete('/:id', deleteCampanha)
  fastify.post('/:id/importar', importCampanha)

  // Download do modelo Excel de campanha
  fastify.get('/modelo', async (_req, reply) => {
    const modelPath = path.resolve('static/core/models/modelo_campanha.xlsx')
    return reply
      .header('Content-Disposition', 'attachment; filename="modelo_campanha.xlsx"')
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(createReadStream(modelPath))
  })
}
