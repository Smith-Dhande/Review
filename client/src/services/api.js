/**
 * Centralized API service layer.
 * Uses HttpOnly cookie-based sessions (credentials: 'include') and
 * in-memory CSRF tokens (never stored in localStorage/sessionStorage).
 */

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

let inMemoryCsrfToken = null

export function setCsrfToken(token) {
  inMemoryCsrfToken = token || null
}

export function resolveAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (BASE.startsWith('http') && url.startsWith('/api')) {
    const origin = BASE.replace(/\/api$/, '')
    return `${origin}${url}`
  }
  return url
}

async function fetchCsrfToken() {
  const res = await fetch(`${BASE}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  })
  if (res.ok) {
    const data = await res.json().catch(() => ({}))
    if (data.csrfToken) {
      inMemoryCsrfToken = data.csrfToken
    }
  }
  return inMemoryCsrfToken
}

async function ensureCsrfToken() {
  if (inMemoryCsrfToken) return inMemoryCsrfToken
  return fetchCsrfToken()
}

async function refreshCsrfToken() {
  inMemoryCsrfToken = null
  return fetchCsrfToken()
}

async function request(path, options = {}, _retriedCsrf = false) {
  const url = `${BASE}${path}`
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (isMutation) {
    const token = await ensureCsrfToken()
    if (token) {
      headers['X-CSRF-Token'] = token
    }
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (
      res.status === 403 &&
      isMutation &&
      !_retriedCsrf &&
      typeof body.message === 'string' &&
      body.message.toLowerCase().includes('csrf')
    ) {
      const freshToken = await refreshCsrfToken()
      if (freshToken) {
        return request(path, options, true)
      }
    }
    const error = new Error(body.message || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }

  const data = await res.json()
  if (data && typeof data.csrfToken === 'string') {
    inMemoryCsrfToken = data.csrfToken
  }
  return data
}

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  csrf: () => request('/auth/csrf'),
  me: () => request('/auth/me'),
  updateMe: (data) =>
    request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: ({ currentPassword, newPassword, confirmPassword }) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }),
}

// ── Businesses (Admin) ──────────────────────────────────
export const businessesApi = {
  list: ({ page, limit, search, status } = {}) => {
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))
    if (search) params.set('search', search)
    if (status && status !== 'all') params.set('status', status)
    const qs = params.toString()
    return request(qs ? `/businesses?${qs}` : '/businesses')
  },
  get: (id) => request(`/businesses/${id}`),
  create: (data) =>
    request('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) => request(`/businesses/${id}`, { method: 'DELETE' }),
  updateQuestions: (id, questions) =>
    request(`/businesses/${id}/questions`, {
      method: 'PUT',
      body: JSON.stringify({ questions }),
    }),
  classifyQuestion: (text) =>
    request('/businesses/classify-question', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  uploadLogo: async (file, _retriedCsrf = false) => {
    const token = await ensureCsrfToken()
    const formData = new FormData()
    formData.append('logo', file)

    const res = await fetch(`${BASE}/uploads/logo`, {
      method: 'POST',
      headers: token ? { 'X-CSRF-Token': token } : {},
      body: formData,
      credentials: 'include',
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (
        res.status === 403 &&
        !_retriedCsrf &&
        typeof body.message === 'string' &&
        body.message.toLowerCase().includes('csrf')
      ) {
        const freshToken = await refreshCsrfToken()
        if (freshToken) {
          return businessesApi.uploadLogo(file, true)
        }
      }
      const error = new Error(body.message || `Upload failed (${res.status})`)
      error.status = res.status
      throw error
    }
    return res.json()
  },
  getQr: (id) => request(`/businesses/${id}/qr?format=json`),
}

// ── Analytics ───────────────────────────────────────────
export const analyticsApi = {
  overview: ({ range = '30d', from, to } = {}) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom' && from) params.set('from', from)
    if (range === 'custom' && to) params.set('to', to)
    return request(`/analytics/overview?${params.toString()}`)
  },
  business: (businessId, { range = '30d', from, to } = {}) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom' && from) params.set('from', from)
    if (range === 'custom' && to) params.set('to', to)
    return request(`/analytics/business/${businessId}?${params.toString()}`)
  },
}

// ── Public Customer Review Experience ───────────────────
export const publicReviewApi = {
  getByBusiness: (publicId) => request(`/public/businesses/${publicId}`),
  completeQuestionnaire: (
    publicId,
    { rating, answers, isRegenerate = false },
  ) =>
    request(`/public/businesses/${publicId}/questionnaire/complete`, {
      method: 'POST',
      body: JSON.stringify({ rating, answers, isRegenerate }),
    }),
  trackEvent: (publicId, event, extra = {}) =>
    request(`/public/businesses/${publicId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event, ...extra }),
    }),
}
