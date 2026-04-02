import type { FastifyInstance } from 'fastify'
import {
  listParceirosExternos,
  listMetasResumo,
  downloadModelo,
  importarMetas,
  listMetas,
  saveMetas,
} from './meta.controller.js'

export async function metaRoutes(fastify: FastifyInstance) {
  // Rotas estáticas ANTES de qualquer /:param para evitar conflito no Fastify
  fastify.get('/parceiros', listParceirosExternos)
  fastify.get('/resumo', listMetasResumo)
  fastify.get('/modelo', downloadModelo)
  fastify.post('/importar', importarMetas)
  fastify.get('/', listMetas)
  fastify.post('/', saveMetas)
}
