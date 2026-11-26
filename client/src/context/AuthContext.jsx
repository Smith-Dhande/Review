import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rb_user')
      const token = localStorage.getItem('rb_token')
      return stored && token ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('rb_token', data.token)
      localStorage.setItem('rb_user', JSON.stringify(data.user))
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.message || 'Invalid email or password')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('rb_token')
    localStorage.removeItem('rb_user')
    setUser(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, error, login, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
