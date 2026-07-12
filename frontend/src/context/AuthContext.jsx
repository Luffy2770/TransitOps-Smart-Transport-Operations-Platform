import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('transitops_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('transitops_token'))

  const login = useCallback(async (email, password) => {
    // Backend contract (per plan): POST /login -> { access_token, role, email }
    const res = await api.post('/auth/login', { email, password })
    const { access_token, role, email: returnedEmail } = res.data

    const nextUser = { email: returnedEmail ?? email, role }
    localStorage.setItem('transitops_token', access_token)
    localStorage.setItem('transitops_user', JSON.stringify(nextUser))
    setToken(access_token)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_token')
    localStorage.removeItem('transitops_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, isAuthenticated: Boolean(token), login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
