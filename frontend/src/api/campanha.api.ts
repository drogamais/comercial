import { apiClient } from './client.ts'

export interface Campanha {
  id: number
  nome: string
  dataInicio: string
  dataFim: string
  status: number
  parceiroId: number | null
  parceiro?: { id: number; nomeAjustado: string; nomeFantasia: string | null } | null
  dataAtualizacao: string
}

export interface CampanhaPayload {
  nome: string
  dataInicio: string
  dataFim: string
  status?: number
  parceiroId?: number | null
}

export const campanhaApi = {
  list: () => apiClient.get<Campanha[]>('/api/campanhas').then((r) => r.data),
  get: (id: number) => apiClient.get<Campanha>(`/api/campanhas/${id}`).then((r) => r.data),
  create: (data: CampanhaPayload) => apiClient.post<Campanha>('/api/campanhas', data).then((r) => r.data),
  update: (id: number, data: Partial<CampanhaPayload>) =>
    apiClient.put<Campanha>(`/api/campanhas/${id}`, data).then((r) => r.data),
  delete: (id: number, senha: string) =>
    apiClient.delete(`/api/campanhas/${id}`, { data: { senha } }).then((r) => r.data),
}
