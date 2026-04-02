import { apiClient } from './client.ts'

export interface CampanhaProduto {
  id: number
  campanhaId: number
  codigoBarras: string | null
  codigoBarrasNormalizado: string | null
  codigoInterno: string | null
  descricao: string | null
  precoNormal: string | null
  precoDesconto: string | null
  laboratorio?: string | null
  tipoPreco?: string | null
  precoDescontoCliente?: string | null
  precoApp?: string | null
  tipoRegra?: string | null
  pontuacao?: number | null
  rebaixe?: string | null
  qtdLimite?: number | null
  dataAtualizacao: string
}

export const campanhaProdutoApi = {
  list: (campanhaId: number) =>
    apiClient.get<CampanhaProduto[]>(`/api/campanhas/${campanhaId}/produtos`).then((r) => r.data),
  add: (campanhaId: number, data: Partial<CampanhaProduto>) =>
    apiClient.post<CampanhaProduto>(`/api/campanhas/${campanhaId}/produtos`, data).then((r) => r.data),
  update: (campanhaId: number, produtos: Array<{ id: number } & Partial<CampanhaProduto>>) =>
    apiClient.patch(`/api/campanhas/${campanhaId}/produtos`, { produtos }).then((r) => r.data),
  delete: (campanhaId: number, ids: number[], senha: string) =>
    apiClient.delete(`/api/campanhas/${campanhaId}/produtos`, { data: { ids, senha } }).then((r) => r.data),
  upload: (campanhaId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post(`/api/campanhas/${campanhaId}/produtos/upload`, form).then((r) => r.data)
  },
  validateGtins: (campanhaId: number, products: Array<{ id: number; gtin: string }>) =>
    apiClient
      .post<{ validGtins: string[]; updatedCount: number }>(
        `/api/campanhas/${campanhaId}/produtos/validate-gtins`,
        { products }
      )
      .then((r) => r.data),
  exportUrl: (campanhaId: number) => `/api/campanhas/${campanhaId}/produtos/export`,
}
