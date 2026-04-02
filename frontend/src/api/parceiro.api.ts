import { apiClient } from './client.ts'

export interface Parceiro {
  id: number
  apiUserId: string | null
  nomeAjustado: string
  tipo: 'INDUSTRIA' | 'DISTRIBUIDOR' | null
  cnpj: string | null
  nomeFantasia: string | null
  razaoSocial: string | null
  gestor: string | null
  telefoneGestor: string | null
  emailGestor: string | null
  dataEntrada: string | null
  dataSaida: string | null
  status: number
  senhaDefinida: boolean
  contratoArquivo: string | null
  dataAtualizacao: string
}

export const parceiroApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<Parceiro[]>('/api/parceiros', { params }).then((r) => r.data),
  nomesAjustados: () =>
    apiClient.get<string[]>('/api/parceiros/nomes-ajustados').then((r) => r.data),
  create: (formData: FormData) =>
    apiClient.post<Parceiro>('/api/parceiros', formData).then((r) => r.data),
  update: (id: number, formData: FormData) =>
    apiClient.put<Parceiro>(`/api/parceiros/${id}`, formData).then((r) => r.data),
  delete: (id: number, senha: string) =>
    apiClient.delete(`/api/parceiros/${id}`, { data: { senha } }).then((r) => r.data),
  setPassword: (id: number, novaSenha: string, confirmarSenha: string) =>
    apiClient
      .post(`/api/parceiros/${id}/set-password`, { novaSenha, confirmarSenha })
      .then((r) => r.data),
  contratoUrl: (id: number) => `/api/parceiros/${id}/contrato`,
  exportUrl: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return `/api/parceiros/export${q}`
  },
}
