import { createContext, useContext, useState, type ReactNode } from 'react'

export interface AuthUser {
  sub: string
  email: string
  name: string
  groups?: string[]
  accessToken?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_USER: AuthUser = {
  sub: 'dev-user-local',
  email: 'dev@local',
  name: 'Dev User',
  groups: ['admin'],
}

const REQUIRE_AUTH = import.meta.env.VITE_REQUIRE_AUTH !== 'false'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(!REQUIRE_AUTH ? MOCK_USER : null)
  const [isLoading] = useState(false)

  function logout() {
    setUser(null)
    if (REQUIRE_AUTH) {
      // Redirecionar para Authentik logout (configurar URL via env se necessário)
      window.location.href = '/auth/logout'
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
