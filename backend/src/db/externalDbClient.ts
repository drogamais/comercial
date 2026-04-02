import mysql from 'mysql2/promise'
import { config } from '../config.js'
import type { RowDataPacket } from 'mysql2'

// Pool de ligação read-only para tabelas externas (dim_plugpharma_produtos, gold_dim_*)
// Em desenvolvimento local (Docker), estas tabelas podem não existir.
// Todas as funções retornam valores vazios graciosamente em caso de erro.

let pool: mysql.Pool | null = null

function getPool(): mysql.Pool {
  if (!pool) {
    if (!config.DB_HOST || !config.DB_USER) {
      throw new Error('Database not configured')
    }
    pool = mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      charset: 'utf8mb4',
      connectionLimit: 5,
      waitForConnections: true,
    })
  }
  return pool
}

export async function validateGtins(gtinList: string[]): Promise<Set<string>> {
  if (!gtinList.length) return new Set()
  try {
    const placeholders = gtinList.map(() => '?').join(',')
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT codigo_barras FROM dim_plugpharma_produtos
       WHERE codigo_principal = 1 AND codigo_barras IN (${placeholders})`,
      gtinList
    )
    return new Set((rows as { codigo_barras: string }[]).map((r) => r.codigo_barras))
  } catch {
    return new Set()
  }
}

export async function getCodigoInternoMap(gtinList: string[]): Promise<Record<string, string>> {
  if (!gtinList.length) return {}
  try {
    const placeholders = gtinList.map(() => '?').join(',')
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT codigo_barras, codigo_interno FROM dim_plugpharma_produtos
       WHERE codigo_principal = 1 AND codigo_barras IN (${placeholders})`,
      gtinList
    )
    return Object.fromEntries(
      (rows as { codigo_barras: string; codigo_interno: string }[]).map((r) => [
        r.codigo_barras,
        r.codigo_interno,
      ])
    )
  } catch {
    return {}
  }
}

export async function getNomesAjustados(): Promise<string[]> {
  try {
    const [rows] = await getPool().query<RowDataPacket[]>(`
      SELECT nome FROM (
        SELECT DISTINCT Fornecedor AS nome FROM gold_dim_acode_fornecedor
         WHERE Fornecedor IS NOT NULL AND TRIM(Fornecedor) <> ''
        UNION
        SELECT DISTINCT Fabricante AS nome FROM gold_dim_acode_fabricante
         WHERE Fabricante IS NOT NULL AND TRIM(Fabricante) <> ''
      ) nomes ORDER BY nome ASC
    `)
    return (rows as { nome: string }[]).map((r) => r.nome).filter(Boolean)
  } catch {
    return []
  }
}
