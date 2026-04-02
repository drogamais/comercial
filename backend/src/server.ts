import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { config } from './config.js'
import authPlugin from './plugins/auth.js'
import { registerRoutes } from './routes/index.js'
import { iniciarSchedulerCampanhas } from './services/campanhaScheduler.service.js'

async function buildServer() {
  const fastify = Fastify({
    logger: {
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  // Plugins
  await fastify.register(cors, {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })

  await fastify.register(multipart, {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  })

  await fastify.register(authPlugin)

  // Routes
  await registerRoutes(fastify)

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}

async function main() {
  const server = await buildServer()
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' })
    iniciarSchedulerCampanhas()
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
