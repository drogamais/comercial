import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { config } from '../config.js'

export interface AuthUser {
  sub: string
  email: string
  name: string
  groups?: string[]
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: AuthUser
  }
}

const MOCK_USER: AuthUser = {
  sub: 'dev-user-local',
  email: 'dev@local',
  name: 'Dev User',
  groups: ['admin'],
}

async function authPlugin(fastify: FastifyInstance) {
  if (!config.REQUIRE_AUTH) {
    // Bypass mode: injeta mock user sem validar token
    fastify.decorateRequest('user', null)
    fastify.decorate('verifyToken', async (request: FastifyRequest) => {
      request.user = MOCK_USER
    })
    fastify.log.warn('⚠️  Auth bypass ATIVO (REQUIRE_AUTH=false) — não usar em produção!')
    return
  }

  // Modo produção: verifica JWT Authentik via JWKS
  if (!config.AUTHENTIK_ISSUER) {
    throw new Error('AUTHENTIK_ISSUER é obrigatório quando REQUIRE_AUTH=true')
  }

  const jwksUrl = new URL(`${config.AUTHENTIK_ISSUER.replace(/\/$/, '')}/.well-known/jwks.json`)
  const JWKS = createRemoteJWKSet(jwksUrl)

  fastify.decorateRequest('user', null)
  fastify.decorate('verifyToken', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Token em falta' })
    }
    const token = authHeader.slice(7)
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: config.AUTHENTIK_ISSUER,
        audience: config.AUTHENTIK_CLIENT_ID || undefined,
      })
      request.user = {
        sub: String(payload.sub ?? ''),
        email: String(payload.email ?? ''),
        name: String(payload.name ?? payload.preferred_username ?? ''),
        groups: Array.isArray(payload.groups) ? (payload.groups as string[]) : [],
      }
    } catch {
      return reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}

export default fp(authPlugin, { name: 'auth' })
