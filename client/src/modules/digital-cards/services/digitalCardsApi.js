const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

let csrfTokenCache = null

async function fetchCsrf() {
  const res = await fetch(`${BASE}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  })
  if (res.ok) {
    const data = await res.json().catch(() => ({}))
    if (data.csrfToken) csrfTokenCache = data.csrfToken
  }
  return csrfTokenCache
}

async function ensureCsrf() {
  return csrfTokenCache || fetchCsrf()
}

async function request(path, options = {}, _retried = false) {
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (isMutation) {
    const token = await ensureCsrf()
    if (token) headers['X-CSRF-Token'] = token
  }

  const res = await fetch(`${BASE}${path}`, {
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
      !_retried &&
      typeof body.message === 'string' &&
      body.message.toLowerCase().includes('csrf')
    ) {
      csrfTokenCache = null
      const fresh = await fetchCsrf()
      if (fresh) return request(path, options, true)
    }
    const err = new Error(body.message || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  if (data && typeof data.csrfToken === 'string') {
    csrfTokenCache = data.csrfToken
  }
  return data
}

export const digitalCardsApi = {
  list: ({ page = 1, limit = 12, search = '', status = 'all' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (search) params.set('search', search)
    if (status && status !== 'all') params.set('status', status)
    return request(`/digital-cards?${params.toString()}`)
  },
  get: (id) => request(`/digital-cards/${id}`),
  create: (payload) =>
    request('/digital-cards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/digital-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateStatus: (id, status) =>
    request(`/digital-cards/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  duplicate: (id) =>
    request(`/digital-cards/${id}/duplicate`, { method: 'POST' }),
  remove: (id) => request(`/digital-cards/${id}`, { method: 'DELETE' }),
  analyticsOverview: ({ range = '30d', from, to } = {}) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom' && from) params.set('from', from)
    if (range === 'custom' && to) params.set('to', to)
    return request(`/digital-cards/analytics/overview?${params.toString()}`)
  },
  cardAnalytics: (id, { range = '30d', from, to } = {}) => {
    const params = new URLSearchParams({ range })
    if (range === 'custom' && from) params.set('from', from)
    if (range === 'custom' && to) params.set('to', to)
    return request(`/digital-cards/${id}/analytics?${params.toString()}`)
  },
  getQr: (id) => request(`/digital-cards/${id}/qr?format=json`),
  uploadAsset: async (file, _retried = false) => {
    const token = await ensureCsrf()
    const formData = new FormData()
    formData.append('logo', file)
    const res = await fetch(`${BASE}/uploads/logo?scope=digital-card`, {
      method: 'POST',
      headers: token ? { 'X-CSRF-Token': token } : {},
      body: formData,
      credentials: 'include',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (
        res.status === 403 &&
        !_retried &&
        typeof body.message === 'string' &&
        body.message.toLowerCase().includes('csrf')
      ) {
        csrfTokenCache = null
        await fetchCsrf()
        return digitalCardsApi.uploadAsset(file, true)
      }
      const err = new Error(body.message || `Upload failed (${res.status})`)
      err.status = res.status
      throw err
    }
    return res.json()
  },
  cleanupAsset: (publicId) =>
    request('/uploads/logo', {
      method: 'DELETE',
      body: JSON.stringify({ publicId }),
    }),
  getPublic: (slug) => request(`/public/digital-cards/${slug}`),
  trackPublicEvent: (slug, event, target = '') =>
    request(`/public/digital-cards/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify({ event, ...(target ? { target } : {}) }),
    }),
  getVCardUrl: (slug) => `${BASE}/public/digital-cards/${slug}/vcard`,
}
