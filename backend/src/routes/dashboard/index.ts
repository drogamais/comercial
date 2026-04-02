import type { FastifyInstance } from 'fastify'
import { getDashboardSummary } from './dashboard.controller.js'

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/summary', getDashboardSummary)
}
