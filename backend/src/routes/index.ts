import type { FastifyInstance } from 'fastify'
import { campanhaRoutes } from './campanha/index.js'
import { campanhaProdutoRoutes } from './campanhaProduto/index.js'
import { parceiroRoutes } from './parceiro/index.js'
import { metaRoutes } from './meta/index.js'
import { dashboardRoutes } from './dashboard/index.js'

export async function registerRoutes(fastify: FastifyInstance) {
  const preHandler = [fastify.verifyToken]

  await fastify.register(dashboardRoutes, { prefix: '/api/dashboard', preHandler })
  await fastify.register(campanhaRoutes, { prefix: '/api/campanhas', preHandler })
  await fastify.register(campanhaProdutoRoutes, { prefix: '/api/campanhas', preHandler })
  await fastify.register(parceiroRoutes, { prefix: '/api/parceiros', preHandler })
  await fastify.register(metaRoutes, { prefix: '/api/metas', preHandler })
}
