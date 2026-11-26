/**
 * Centralized API service layer.
 * Uses VITE_API_URL if configured for production, otherwise /api (proxied in vite.config.js).
 */

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export function resolveAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  if (BASE.startsWith('http') && url.startsWith('/api')) {
    const origin = BASE.replace(/\/api$/, '')
    return `${origin}${url}`
  }
  return url
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = localStorage.getItem('rb_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const error = new Error(body.message || `Request failed (${res.status})`)
    error.status = res.status
    throw error
  }

  return res.json()
}

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
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
  uploadLogo: ({ mimeType, dataBase64 }) =>
    request('/businesses/upload-logo', {
      method: 'POST',
      body: JSON.stringify({ mimeType, dataBase64 }),
    }),
  getQr: (id) => request(`/businesses/${id}/qr?format=json`),
}

// ── Public Customer Review Experience ───────────────────
export const publicReviewApi = {
  getByBusiness: (publicId) => request(`/public/businesses/${publicId}`),
  completeQuestionnaire: (publicId, answers, isRegenerate = false) =>
    request(`/public/businesses/${publicId}/questionnaire/complete`, {
      method: 'POST',
      body: JSON.stringify({ answers, isRegenerate }),
    }),
  trackEvent: (publicId, event) =>
    request(`/public/businesses/${publicId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event }),
    }),
}
