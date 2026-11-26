import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// Mock credentials for Phase 1 development
const MOCK_CREDENTIALS = {
  email: 'admin@reviewbuddy.com',
  password: 'password',
}

const MOCK_USER = {
  id: '1',
  name: 'Admin',
  email: 'admin@reviewbuddy.com',
  role: 'Administrator',
  avatar: null,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rb_user')
    return stored ? JSON.parse(stored) : null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setError(null)

    // TODO: Replace with actual API call to POST /api/auth/login
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      if (
        email === MOCK_CREDENTIALS.email &&
        password === MOCK_CREDENTIALS.password
      ) {
        const userData = { ...MOCK_USER, email }
        localStorage.setItem('rb_user', JSON.stringify(userData))
        setUser(userData)
        return true
      } else {
        setError('Invalid email or password')
        return false
      }
    } catch {
      setError('Something went wrong. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
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
