/**
 * Centralized API service layer.
 *
 * All backend calls go through this module so the frontend
 * has a single place to swap mock data for real endpoints.
 *
 * Base URL is proxied via vite.config.js → http://localhost:3001
 */

const BASE = '/api'

async function request(path, options = {}) {
  const url = `${BASE}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // TODO: attach auth token when backend is ready
  // const token = localStorage.getItem('rb_token')
  // if (token) headers['Authorization'] = `Bearer ${token}`

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
export const auth = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
}

// ── Businesses (includes review config, questionnaire, single public URL/QR) ──
export const businesses = {
  list: (params) => request(`/businesses?${new URLSearchParams(params)}`),
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
}

// ── Public Customer Review Experience ───────────────────
export const publicReview = {
  getByBusiness: (businessId) => request(`/public/review/${businessId}`),
  trackEvent: (businessId, event) =>
    request(`/public/review/${businessId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event }),
    }),
}

// ── Analytics ───────────────────────────────────────────
export const analytics = {
  overview: (params) =>
    request(`/analytics/overview?${new URLSearchParams(params)}`),
}
