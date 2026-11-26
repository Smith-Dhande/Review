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

async function ensureCsrfToken() {
  if (inMemoryCsrfToken) return inMemoryCsrfToken
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

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const method = (options.method || 'GET').toUpperCase()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
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
  list: () => request('/businesses'),
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
  uploadLogo: async (file) => {
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
      const error = new Error(body.message || `Upload failed (${res.status})`)
      error.status = res.status
      throw error
    }
    return res.json()
  },
  getQr: (id) => request(`/businesses/${id}/qr?format=json`),
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
