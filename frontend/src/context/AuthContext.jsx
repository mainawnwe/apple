import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

    useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    const MIN_MS = 400   // ← minimum splash duration
    const startedAt = Date.now()

    authApi.getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => {
        const elapsed = Date.now() - startedAt
        const remaining = Math.max(0, MIN_MS - elapsed)
        setTimeout(() => setLoading(false), remaining)
      })
  }, [])
  const login = (token, user) => {
    localStorage.setItem('token', token)
    setUser(user)
  }

  const logout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
