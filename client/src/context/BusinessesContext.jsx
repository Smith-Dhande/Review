import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { initialBusinessesData } from '../data/mockData'

const BusinessesContext = createContext(null)

function generateLogoText(name) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'RB'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// eslint-disable-next-line react-refresh/only-export-components
export function getPublicReviewUrl(businessId) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/review/${businessId}`
  }
  return `https://reviewbuddy.com/review/${businessId}`
}

export function BusinessesProvider({ children }) {
  const [businesses, setBusinesses] = useState(initialBusinessesData)

  const addBusiness = useCallback((payload) => {
    const id = String(Date.now())
    const slug = slugify(payload.name) || `business-${id}`
    const newBusiness = {
      id,
      name: payload.name.trim(),
      slug,
      category: payload.category,
      location: payload.location?.trim() || '',
      address: payload.address?.trim() || '',
      phone: payload.phone?.trim() || '',
      email: payload.email?.trim() || '',
      logoText: generateLogoText(payload.name),
      status: payload.status || 'active',
      dateAdded: new Date().toISOString().slice(0, 10),
      reviewConfig: {
        googleReviewUrl: payload.googleReviewUrl?.trim() || '',
        welcomeMessage:
          payload.welcomeMessage?.trim() ||
          `Thanks for visiting ${payload.name.trim()}! Answer a few quick questions to draft your review.`,
        tone: 'Friendly',
        length: 'Medium',
        autoCopyPrompt: true,
      },
      questions: [],
      analytics: {
        totalScans: 0,
        landingViews: 0,
        questionnaireCompletions: 0,
        reviewDraftsGenerated: 0,
        copyClicks: 0,
        googleReviewRedirects: 0,
      },
    }
    setBusinesses((prev) => [newBusiness, ...prev])
    return newBusiness
  }, [])

  const updateBusiness = useCallback((id, updates) => {
    setBusinesses((prev) =>
      prev.map((biz) => {
        if (biz.id !== id) return biz
        const nextName =
          updates.name !== undefined ? updates.name.trim() : biz.name
        return {
          ...biz,
          ...updates,
          name: nextName,
          logoText: updates.name ? generateLogoText(nextName) : biz.logoText,
        }
      }),
    )
  }, [])

  const toggleBusinessStatus = useCallback((id) => {
    setBusinesses((prev) =>
      prev.map((biz) => {
        if (biz.id !== id) return biz
        return {
          ...biz,
          status: biz.status === 'active' ? 'paused' : 'active',
        }
      }),
    )
  }, [])

  const updateReviewConfig = useCallback((id, configUpdates) => {
    setBusinesses((prev) =>
      prev.map((biz) =>
        biz.id === id
          ? { ...biz, reviewConfig: { ...biz.reviewConfig, ...configUpdates } }
          : biz,
      ),
    )
  }, [])

  const setQuestions = useCallback((id, updater) => {
    setBusinesses((prev) =>
      prev.map((biz) => {
        if (biz.id !== id) return biz
        const nextQuestions =
          typeof updater === 'function' ? updater(biz.questions) : updater
        return { ...biz, questions: nextQuestions }
      }),
    )
  }, [])

  const recordPublicEvent = useCallback((id, metricKey) => {
    setBusinesses((prev) =>
      prev.map((biz) => {
        if (biz.id !== id) return biz
        return {
          ...biz,
          analytics: {
            ...biz.analytics,
            [metricKey]: (biz.analytics?.[metricKey] || 0) + 1,
          },
        }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({
      businesses,
      addBusiness,
      updateBusiness,
      toggleBusinessStatus,
      updateReviewConfig,
      setQuestions,
      recordPublicEvent,
    }),
    [
      businesses,
      addBusiness,
      updateBusiness,
      toggleBusinessStatus,
      updateReviewConfig,
      setQuestions,
      recordPublicEvent,
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
