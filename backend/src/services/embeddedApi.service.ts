// Port fiel de services/parceiros_embedded_service.py
import { config } from '../config.js'

const BASE_URL = 'https://api.powerembedded.com.br/api/user'
export const PARCEIROS_INDUSTRIA_GROUP_ID = '3c4761f3-89ef-4642-92ee-b30d214b92d5'
export const PARCEIROS_DISTRIBUIDOR_GROUP_ID = 'ca8a1c8d-4ac5-44eb-b594-0417ce882e12'
export const PARCEIROS_CAMPANHA_GROUP_ID = 'ce4804e0-c090-4756-a00c-617b2f4e7f56'

function getHeaders() {
  return {
    'X-API-Key': config.EMBEDDED_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

interface ParceiroData {
  emailGestor?: string | null
  nomeFantasia?: string | null
  tipo?: string | null
  dataSaida?: Date | string | null
  apiUserId?: string | null
}

function buildApiPayload(data: ParceiroData, apiUserId?: string | null) {
  if (!data.emailGestor) throw new Error("O campo 'E-mail Gestor' é obrigatório para a API.")
  if (!data.nomeFantasia) throw new Error("O campo 'Nome Fantasia' é obrigatório para a API.")

  let expirationDate: string | null = null
  if (data.dataSaida) {
    const d = new Date(data.dataSaida)
    expirationDate = d.toISOString().split('T')[0] + 'T00:00:00Z'
  }

  const payload: Record<string, unknown> = {
    name: data.nomeFantasia,
    email: data.emailGestor,
    role: 3,
    department: data.tipo ?? null,
    expirationDate,
    reportLandingPage: null,
    windowsAdUser: null,
    bypassFirewall: false,
    canEditReport: false,
    canCreateReport: false,
    canOverwriteReport: false,
    canRefreshDataset: false,
    canCreateSubscription: false,
    canDownloadPbix: false,
    canExportReportWithHiddenPages: false,
    canCreateNewUsers: false,
    canStartCapacityByDemand: false,
    canDisplayVisualHeaders: true,
    canExportReportOtherPages: false,
    accessReportAnyTime: true,
    sendWelcomeEmail: true,
  }

  if (apiUserId) payload.id = apiUserId

  return payload
}

async function apiJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) })
    let body: unknown = null
    try {
      body = await res.json()
    } catch {}
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    throw new Error(`Falha de conexão com a API: ${err}`)
  }
}

// ── CREATE ────────────────────────────────────────────────────────────────────

async function cadastrarUsuarioEBuscarId(data: ParceiroData): Promise<[string | null, string | null]> {
  const payload = buildApiPayload(data)
  const postRes = await apiJson(BASE_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  if (!postRes.ok) {
    if (postRes.status === 401) return [null, 'API Erro 401: Não Autorizado. Verifique a Chave de API.']
    const msg = (postRes.body as Record<string, string>)?.message ?? String(postRes.body)
    return [null, `API Embedded Erro ${postRes.status} (POST): ${msg}`]
  }

  const email = data.emailGestor!
  const getRes = await apiJson(`${BASE_URL}?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (getRes.ok) {
    const userList = (getRes.body as Record<string, unknown>)?.data as unknown[]
    if (userList?.length) {
      const id = (userList[0] as Record<string, string>)?.id
      if (id) return [id, null]
      return [null, 'API criou o utilizador mas veio sem "id" no JSON.']
    }
    return [null, `API criou o utilizador (POST 200), mas GET por '${email}' não o encontrou.`]
  }

  return [null, `API criou o utilizador (POST 200), mas GET falhou (${getRes.status}).`]
}

// ── LINK / UNLINK GROUP ───────────────────────────────────────────────────────

export async function adicionarUsuarioAoGrupo(userEmail: string, groupId: string): Promise<[boolean, string | null]> {
  if (!userEmail || !groupId) return [false, 'Email ou Group ID em falta.']
  const res = await apiJson(`${BASE_URL}/link-groups`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ userEmail, groups: [groupId] }),
  })
  if (res.ok) return [true, null]
  if (res.status === 401) return [false, 'API Erro 401 (Link Group): Não Autorizado.']
  const msg = (res.body as Record<string, string>)?.message ?? ''
  if (msg.toLowerCase().includes('already linked')) return [true, null]
  return [false, `API Erro ${res.status} (Link Group): ${msg}`]
}

export async function removerUsuarioDoGrupo(userEmail: string, groupId: string): Promise<[boolean, string | null]> {
  if (!userEmail || !groupId) return [false, 'Email ou Group ID em falta.']
  const res = await apiJson(`${BASE_URL}/unlink-groups`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ userEmail, groups: [groupId] }),
  })
  if (res.ok) return [true, null]
  const msg = (res.body as Record<string, string>)?.message ?? ''
  if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('not linked')) return [true, null]
  return [false, `API Erro ${res.status} (Unlink Group): ${msg}`]
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function atualizarUsuario(apiUserId: string | null | undefined, data: ParceiroData): Promise<[boolean, string | null]> {
  if (!apiUserId) return [true, null] // sem id local, permite update local
  const payload = buildApiPayload(data, apiUserId)
  const res = await apiJson(BASE_URL, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (res.ok) return [true, null]
  if (res.status === 401) return [false, 'API Erro 401: Não Autorizado.']
  if (res.status === 404) return [false, `API Erro 404: Utilizador '${apiUserId}' não encontrado.`]
  const msg = (res.body as Record<string, string>)?.message ?? ''
  return [false, `API Embedded Erro ${res.status} (PUT): ${msg}`]
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deletarUsuario(email: string | null | undefined): Promise<[boolean, string | null]> {
  if (!email) return [true, null]
  const res = await apiJson(`${BASE_URL}/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (res.ok || res.status === 404) return [true, null]
  if (res.status === 401) return [false, 'API Erro 401: Não Autorizado.']
  const msg = (res.body as Record<string, string>)?.message ?? ''
  return [false, `API Embedded Erro ${res.status} (DELETE): ${msg}`]
}

// ── ROLLBACK ──────────────────────────────────────────────────────────────────

async function rollbackCriacaoUsuario(email: string) {
  try {
    await fetch(`${BASE_URL}/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: getHeaders(),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {}
}

// ── SET PASSWORD ──────────────────────────────────────────────────────────────

export async function definirSenhaUsuario(email: string, novaSenha: string): Promise<[boolean, string | null]> {
  if (!email || !novaSenha) return [false, 'Email ou nova senha não fornecidos.']
  const res = await apiJson(`${BASE_URL}/change-password`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ email, password: novaSenha }),
  })
  if (res.ok) return [true, null]
  if (res.status === 401) return [false, 'API Erro 401 (ChangePass): Não Autorizado.']
  return [false, `API Erro ${res.status} (ChangePass): Erro desconhecido.`]
}

// ── CRIAR PARCEIRO COMPLETO (fluxo principal) ─────────────────────────────────

export async function criarParceiroCompleto(data: ParceiroData): Promise<[string | null, string | null]> {
  const [apiId, erroCreate] = await cadastrarUsuarioEBuscarId(data)
  if (erroCreate) return [null, erroCreate]

  const groupId =
    data.tipo === 'INDUSTRIA'
      ? PARCEIROS_INDUSTRIA_GROUP_ID
      : data.tipo === 'DISTRIBUIDOR'
        ? PARCEIROS_DISTRIBUIDOR_GROUP_ID
        : null

  if (groupId && data.emailGestor) {
    const [ok, erroLink] = await adicionarUsuarioAoGrupo(data.emailGestor, groupId)
    if (!ok) {
      await rollbackCriacaoUsuario(data.emailGestor!)
      return [null, `Erro ao vincular grupo: ${erroLink}. Cadastro revertido.`]
    }
  }

  return [apiId, null]
}
