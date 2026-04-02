import * as XLSX from 'xlsx'
import { padBarcode, cleanBarcode } from '../utils/barcode.js'
import { getCodigoInternoMap } from '../db/externalDbClient.js'

export interface CampanhaProductRow {
  codigoBarras: string | null
  codigoBarrasNormalizado: string | null
  codigoInterno: string | null
  descricao: string | null
  precoNormal: number | null
  precoDesconto: number | null
  // campos tabloide
  laboratorio?: string | null
  tipoPreco?: string | null
  precoDescontoCliente?: number | null
  precoApp?: number | null
  tipoRegra?: string | null
  // campos campanha
  pontuacao?: number | null
  rebaixe?: number | null
  qtdLimite?: number | null
}

function toDecimal(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val).replace(',', '.'))
  return isNaN(n) ? null : n
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseInt(String(val), 10)
  return isNaN(n) ? null : n
}

// Modelo de Campanha:
// Colunas: CÓDIGO DE BARRAS, DESCRIÇÃO, PONTUAÇÃO, PREÇO NORMAL, PREÇO DESCONTO, REBAIXE, QTD LIMITE
export async function parseCampanhaExcel(buffer: Buffer): Promise<CampanhaProductRow[]> {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: null })

  const gtins: string[] = []
  const parsed = raw.map((row) => {
    const barcode = cleanBarcode(row['CÓDIGO DE BARRAS'] ?? row['CODIGO DE BARRAS'])
    const normalizado = padBarcode(barcode)
    if (normalizado) gtins.push(normalizado)
    return {
      codigoBarras: barcode,
      codigoBarrasNormalizado: normalizado,
      codigoInterno: null as string | null,
      descricao: row['DESCRIÇÃO'] ? String(row['DESCRIÇÃO']) : null,
      precoNormal: toDecimal(row['PREÇO NORMAL'] ?? row['PRECO NORMAL']),
      precoDesconto: toDecimal(row['PREÇO DESCONTO'] ?? row['PRECO DESCONTO']),
      pontuacao: toInt(row['PONTUAÇÃO'] ?? row['PONTUACAO']),
      rebaixe: toDecimal(row['REBAIXE']),
      qtdLimite: toInt(row['QTD LIMITE'] ?? row['QUANTIDADE LIMITE']),
    }
  })

  const ciMap = await getCodigoInternoMap(gtins)
  return parsed.map((r) => ({
    ...r,
    codigoInterno: r.codigoBarrasNormalizado ? (ciMap[r.codigoBarrasNormalizado] ?? null) : null,
  }))
}

// Modelo de Tabloide:
// Aba: "Todos"
// Colunas: GTIN, DESCRIÇÃO, LABORATÓRIO, TIPO DE PREÇO, PREÇO NORMAL, PREÇO DESCONTO GERAL, PREÇO DESCONTO CLIENTE+, PREÇO APP, TIPO DE REGRA
export async function parseTabloidExcel(buffer: Buffer): Promise<CampanhaProductRow[]> {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === 'todos')
  if (!sheetName) throw new Error('Aba "Todos" não encontrada no ficheiro.')
  const sheet = wb.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: null })

  const gtins: string[] = []
  const parsed = raw.map((row) => {
    const barcode = cleanBarcode(row['GTIN'] ?? row['CÓDIGO DE BARRAS'])
    const normalizado = padBarcode(barcode)
    if (normalizado) gtins.push(normalizado)
    return {
      codigoBarras: barcode,
      codigoBarrasNormalizado: normalizado,
      codigoInterno: null as string | null,
      descricao: row['DESCRIÇÃO'] ? String(row['DESCRIÇÃO']) : null,
      laboratorio: row['LABORATÓRIO'] ? String(row['LABORATÓRIO']) : null,
      tipoPreco: row['TIPO DE PREÇO'] ? String(row['TIPO DE PREÇO']) : null,
      precoNormal: toDecimal(row['PREÇO NORMAL']),
      precoDesconto: toDecimal(row['PREÇO DESCONTO GERAL']),
      precoDescontoCliente: toDecimal(row['PREÇO DESCONTO CLIENTE+'] ?? row['PREÇO DESCONTO CLIENTE']),
      precoApp: toDecimal(row['PREÇO APP']),
      tipoRegra: row['TIPO DE REGRA'] ? String(row['TIPO DE REGRA']) : null,
    }
  })

  const ciMap = await getCodigoInternoMap(gtins)
  return parsed.map((r) => ({
    ...r,
    codigoInterno: r.codigoBarrasNormalizado ? (ciMap[r.codigoBarrasNormalizado] ?? null) : null,
  }))
}

// Exportar produto para Excel (array de objetos → buffer XLSX)
export function exportToExcel(data: Record<string, unknown>[], sheetName = 'Sheet1'): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
