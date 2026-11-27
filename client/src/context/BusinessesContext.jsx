import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
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

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
}

const DEFAULT_COUNTS = { all: 0, active: 0, paused: 0 }

export function BusinessesProvider({ children }) {
  const { user, logout } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)
  const [counts, setCounts] = useState(DEFAULT_COUNTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastQueryRef = useRef({ page: 1, limit: 10, search: '', status: 'all' })

  const fetchBusinesses = useCallback(
    async (params) => {
      if (!user) return null
      const query = { ...lastQueryRef.current, ...(params || {}) }
      lastQueryRef.current = query
      setLoading(true)
      setError(null)
      try {
        const data = await businessesApi.list(query)
        setBusinesses(data.businesses || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        if (data.counts) {
          setCounts(data.counts)
        }
        return data
      } catch (err) {
        if (err.status === 401) {
          logout()
        } else {
          setError(err.message || 'Failed to load businesses')
        }
        return null
      } finally {
        setLoading(false)
      }
    },
    [user, logout],
  )

  const refreshBusinesses = useCallback(
    () => fetchBusinesses(lastQueryRef.current),
    [fetchBusinesses],
  )

  const visibleBusinesses = useMemo(
    () => (user ? businesses : []),
    [user, businesses],
  )

  const addBusiness = useCallback(
    async (payload) => {
      const data = await businessesApi.create(payload)
      await fetchBusinesses({ ...lastQueryRef.current, page: 1 })
      return data.business
    },
    [fetchBusinesses],
  )

  const updateBusiness = useCallback(
    async (id, updates) => {
      const data = await businessesApi.update(id, updates)
      setBusinesses((prev) =>
        prev.map((biz) =>
          biz.id === id || biz.publicId === id ? data.business : biz,
        ),
      )
      if (updates.status !== undefined) {
        await fetchBusinesses(lastQueryRef.current)
      }
      return data.business
    },
    [fetchBusinesses],
  )

  const toggleBusinessStatus = useCallback(
    async (id, currentStatus) => {
      const target = businesses.find((b) => b.id === id || b.publicId === id)
      const status = currentStatus || target?.status
      if (!status) return null
      const nextStatus = status === 'active' ? 'paused' : 'active'
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
    async (id, updater, currentQuestions = []) => {
      const target = businesses.find((b) => b.id === id || b.publicId === id)
      const baseQuestions = target?.questions || currentQuestions
      const nextQuestions =
        typeof updater === 'function' ? updater(baseQuestions) : updater
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

  const deleteBusiness = useCallback(
    async (id) => {
      await businessesApi.delete(id)
      setBusinesses((prev) =>
        prev.filter((biz) => biz.id !== id && biz.publicId !== id),
      )
      await fetchBusinesses(lastQueryRef.current)
      return true
    },
    [fetchBusinesses],
  )

  const value = useMemo(
    () => ({
      businesses: visibleBusinesses,
      pagination,
      counts,
      loading,
      error,
      fetchBusinesses,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      deleteBusiness,
      toggleBusinessStatus,
      updateReviewConfig,
      updateAppearance,
      setQuestions,
    }),
    [
      visibleBusinesses,
      pagination,
      counts,
      loading,
      error,
      fetchBusinesses,
      refreshBusinesses,
      addBusiness,
      updateBusiness,
      deleteBusiness,
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
