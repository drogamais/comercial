import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // App DB (Prisma)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Database connection (Internal or External)
  DB_HOST: z.string().default('banco_teste'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('comercial_dev'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default('rootpass'),

  // Power Embedded API
  EMBEDDED_API_KEY: z.string().default(''),

  // Auth
  REQUIRE_AUTH: z
    .string()
    .transform((v) => v.toLowerCase() !== 'false')
    .default('false'),
  AUTHENTIK_ISSUER: z.string().default(''),
  AUTHENTIK_CLIENT_ID: z.string().default(''),
  AUTHENTIK_CLIENT_SECRET: z.string().default(''),

  // File storage
  UPLOAD_FOLDER: z.string().default('/mnt/contratos'),

  // Security
  DELETE_PASSWORD: z.string().default('com123'),

  // CORS
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = parsed.data
