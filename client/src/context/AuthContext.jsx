import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import { authApi, setCsrfToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    authApi
      .me()
      .then((data) => {
        if (!active) return
        setUser(data.user || null)
      })
      .catch(() => {
        if (!active) return
        setUser(null)
      })
      .finally(() => {
        if (active) setIsCheckingAuth(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await authApi.login(email, password)
      setUser(data.user)
      return true
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
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
    setCsrfToken(null)
    setUser(null)
    setError(null)
  }, [])

  const changePassword = useCallback(
    async ({ currentPassword, newPassword, confirmPassword }) => {
      return authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
    },
    [],
  )

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isCheckingAuth,
        isLoading,
        error,
        login,
        logout,
        changePassword,
        clearError,
      }}
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
