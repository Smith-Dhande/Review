import crypto from 'crypto'
import { getEnvConfig } from '../config/environment.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function ensureCsrfToken(req) {
  if (!req.session) return null
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
  }
  return req.session.csrfToken
}

function tokensMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf-8')
  const bufB = Buffer.from(b, 'utf-8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Synchronizer CSRF protection + Origin verification for state-changing requests.
 */
export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next()
  }

  const env = getEnvConfig()
  const origin = req.headers.origin
  if (origin) {
    const normalized = origin.replace(/\/+$/, '')
    if (!env.allowedOrigins.includes(normalized)) {
      return res.status(403).json({ message: 'Forbidden origin.' })
    }
  }

  const headerToken = req.headers['x-csrf-token']
  const sessionToken = req.session?.csrfToken

  if (!headerToken || !sessionToken || !tokensMatch(String(headerToken), sessionToken)) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token.' })
  }

  return next()
}
