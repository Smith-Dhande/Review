import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import { businessesApi } from '../services/api'
import { useAuth } from './AuthContext'

const BusinessesContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function getPublicReviewUrl(business) {
  const publicId = business?.publicId || business?.id || business
  const configuredBase = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (configuredBase) {
    return `${configuredBase.replace(/\/+$/, '')}/review/${publicId}`
  }

  const storedUrl = business?.qrPublicUrl || ''
  if (storedUrl && !/localhost|127\.0\.0\.1/i.test(storedUrl)) {
    return storedUrl
  }

  const base = (
    (typeof window !== 'undefined' && window.location?.origin) ||
    'https://reviewbuddy.com'
  ).replace(/\/+$/, '')
  return `${base}/review/${publicId}`
}

export function BusinessesProvider({ children }) {
  const { user, logout } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshBusinesses = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await businessesApi.list()
      setBusinesses(data.businesses || [])
    } catch (err) {
      if (err.status === 401) {
        logout()
      } else {
        setError(err.message || 'Failed to load businesses')
      }
    } finally {
      setLoading(false)
    }
  }, [user, logout])

  useEffect(() => {
    let active = true
    if (!user) return undefined

    businessesApi
      .list()
      .then((data) => {
        if (!active) return
        setBusinesses(data.businesses || [])
        setError(null)
      })
      .catch((err) => {
        if (!active) return
        if (err.status === 401) {
          logout()
        } else {
          setError(err.message || 'Failed to load businesses')
        }
      })

    return () => {
      active = false
    }
  }, [user, logout])

  const visibleBusinesses = useMemo(
    () => (user ? businesses : []),
    [user, businesses],
  )

  const addBusiness = useCallback(async (payload) => {
    const data = await businessesApi.create(payload)
    setBusinesses((prev) => [data.business, ...prev])
    return data.business
  }, [])

  const updateBusiness = useCallback(async (id, updates) => {
    const data = await businessesApi.update(id, updates)
    setBusinesses((prev) =>
      prev.map((biz) =>
        biz.id === id || biz.publicId === id ? data.business : biz,
      ),
    )
    return data.business
  }, [])

  const toggleBusinessStatus = useCallback(
    async (id) => {
      const target = businesses.find((b) => b.id === id || b.publicId === id)
      if (!target) return null
      const nextStatus = target.status === 'active' ? 'paused' : 'active'
      return updateBusiness(id, { status: nextStatus })
    },
    [businesses, updateBusiness],
  )

  const updateReviewConfig = useCallback(
    async (id, configUpdates) => {
      return updateBusiness(id, { reviewConfig: configUpdates })
    },
    [updateBusiness],
  )

  const updateAppearance = useCallback(
    async (id, appearanceUpdates) => {
      return updateBusiness(id, { appearance: appearanceUpdates })
    },
    [updateBusiness],
  )

  const setQuestions = useCallback(
    async (id, updater) => {
      const target = businesses.find((b) => b.id === id || b.publicId === id)
      if (!target) return null
      const nextQuestions =
        typeof updater === 'function' ? updater(target.questions || []) : updater
      const data = await businessesApi.updateQuestions(id, nextQuestions)
      setBusinesses((prev) =>
        prev.map((biz) =>
          biz.id === id || biz.publicId === id ? data.business : biz,
        ),
      )
      return data.business
    },
    [businesses],
  )

  const value = useMemo(
    () => ({
      businesses: visibleBusinesses,
      loading,
      error,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      toggleBusinessStatus,
      updateReviewConfig,
      updateAppearance,
      setQuestions,
    }),
    [
      visibleBusinesses,
      loading,
      error,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      toggleBusinessStatus,
      updateReviewConfig,
      updateAppearance,
      setQuestions,
    ],
  )

  return (
    <BusinessesContext.Provider value={value}>
      {children}
    </BusinessesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBusinesses() {
  const ctx = useContext(BusinessesContext)
  if (!ctx) {
    throw new Error('useBusinesses must be used within a BusinessesProvider')
  }
  return ctx
}
