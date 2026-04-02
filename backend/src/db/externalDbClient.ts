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

// ---- dim_metas ----

export interface ParceiroExternoRow {
  id: number
  nome_fantasia: string
}

export interface MetaSummaryRow {
  id_parceiro: number
  nome_fantasia: string
  mes_referencia: string
}

export interface MetaRow {
  tipo_meta: string
  ean_produto: string
  valor_meta: number
  quantidade: number
  repasse: number
  operador: string
  texto_bi: string
}

export interface MetaInsertRow extends MetaRow {
  id_parceiro: number
  mes_referencia: string
}

export async function getParceiros(): Promise<ParceiroExternoRow[]> {
  try {
    const [rows] = await getPool().query<RowDataPacket[]>(
      'SELECT id, nome_fantasia FROM dim_parceiros ORDER BY nome_fantasia ASC'
    )
    return rows as ParceiroExternoRow[]
  } catch {
    return []
  }
}

export async function listMetasSummary(): Promise<MetaSummaryRow[]> {
  try {
    const [rows] = await getPool().query<RowDataPacket[]>(`
      SELECT m.id_parceiro, p.nome_fantasia, m.mes_referencia
      FROM dim_metas m
      JOIN dim_parceiros p ON p.id = m.id_parceiro
      GROUP BY m.id_parceiro, p.nome_fantasia, m.mes_referencia
      ORDER BY m.mes_referencia DESC, p.nome_fantasia ASC
    `)
    return (rows as { id_parceiro: number; nome_fantasia: string; mes_referencia: Date | string }[]).map((r) => ({
      id_parceiro: r.id_parceiro,
      nome_fantasia: r.nome_fantasia,
      mes_referencia:
        r.mes_referencia instanceof Date
          ? r.mes_referencia.toISOString().split('T')[0]
          : String(r.mes_referencia).split('T')[0],
    }))
  } catch {
    return []
  }
}

export async function getMetasDetalhe(idParceiro: number, mesReferencia: string): Promise<MetaRow[]> {
  try {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT tipo_meta, ean_produto, valor_meta, quantidade, repasse, operador, texto_bi
       FROM dim_metas
       WHERE id_parceiro = ? AND mes_referencia = ?`,
      [idParceiro, mesReferencia]
    )
    return (rows as MetaRow[]).map((r) => ({
      tipo_meta: r.tipo_meta ?? '',
      ean_produto: r.ean_produto ?? '',
      valor_meta: Number(r.valor_meta ?? 0),
      quantidade: Number(r.quantidade ?? 0),
      repasse: Number(r.repasse ?? 0),
      operador: r.operador ?? '',
      texto_bi: r.texto_bi ?? '',
    }))
  } catch {
    return []
  }
}

export async function salvarMetas(
  idParceiro: number,
  mesReferencia: string,
  rows: MetaInsertRow[]
): Promise<number> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM dim_metas WHERE id_parceiro = ? AND mes_referencia = ?', [
      idParceiro,
      mesReferencia,
    ])
    if (rows.length > 0) {
      const values = rows.map((r) => [
        r.id_parceiro,
        r.mes_referencia,
        r.tipo_meta,
        r.ean_produto,
        r.valor_meta,
        r.quantidade,
        r.repasse,
        r.operador,
        r.texto_bi,
      ])
      await conn.query(
        `INSERT INTO dim_metas
          (id_parceiro, mes_referencia, tipo_meta, ean_produto, valor_meta, quantidade, repasse, operador, texto_bi)
         VALUES ?`,
        [values]
      )
    }
    await conn.commit()
    return rows.length
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
