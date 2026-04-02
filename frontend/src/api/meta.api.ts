import { apiClient } from './client'

export interface ParceiroExterno {
  id: number
  nome_fantasia: string
}

export interface MetaSummary {
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

export interface MetaDetalhe {
  produtos: MetaRow[]
  condicionais: MetaRow[]
}

export interface MetaSavePayload {
  id_parceiro: number
  mes_referencia: string
  rows: MetaRow[]
}

export interface CondicionalRule {
  condicao: '<=' | '>'
  valorGatilho: number
  repasse: number
}

export const metaApi = {
  listParceiros: () =>
    apiClient.get<ParceiroExterno[]>('/api/metas/parceiros').then((r) => r.data),

  listResumo: () =>
    apiClient.get<MetaSummary[]>('/api/metas/resumo').then((r) => r.data),

  getDetalhe: (idParceiro: number, mes: string) =>
    apiClient
      .get<MetaDetalhe>('/api/metas', { params: { id_parceiro: idParceiro, mes } })
      .then((r) => r.data),

  save: (payload: MetaSavePayload) =>
    apiClient.post<{ count: number }>('/api/metas', payload).then((r) => r.data),

  importar: (idParceiro: number, mes: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient
      .post<{ count: number }>('/api/metas/importar', form, {
        params: { id_parceiro: idParceiro, mes },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  modeloUrl: () => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const token = localStorage.getItem('access_token')
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''
    return `${base}/api/metas/modelo${tokenParam}`
  },
}

export function formatMesRef(isoDate: string): string {
  const parts = isoDate.split('T')[0].split('-')
  return `${parts[1]}/${parts[0]}`
}

export function fmtBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function buildCondicionalRows(
  rules: CondicionalRule[],
  base: 'valor' | 'quantidade',
  idParceiro: number,
  mesReferencia: string
): MetaRow[] {
  const baseCode = base === 'valor' ? 'VAL' : 'QTD'
  return rules.map((r) => {
    const op = r.condicao
    const rep = r.repasse
    const repTxt = rep.toFixed(2).replace('.', ',') + '%'
    let texto_bi: string
    if (base === 'valor') {
      texto_bi = `Se Sell-in ${op} ${fmtBRL(r.valorGatilho)} ⮕ Repasse: ${repTxt}`
    } else {
      texto_bi = `Se Qtd ${op} ${Math.round(r.valorGatilho)} ⮕ Repasse: ${repTxt}`
    }
    return {
      id_parceiro: idParceiro,
      mes_referencia: mesReferencia,
      tipo_meta: `${baseCode}_${op}`,
      ean_produto: 'GERAL',
      valor_meta: base === 'valor' ? r.valorGatilho : 0,
      quantidade: base === 'quantidade' ? Math.round(r.valorGatilho) : 0,
      repasse: rep,
      operador: op,
      texto_bi,
    } as unknown as MetaRow
  })
}
