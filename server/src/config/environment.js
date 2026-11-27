/**
 * Environment configuration and startup validation.
 * Fails safely in production if critical secrets or database configuration are missing.
 */

const VALID_SAME_SITE = new Set(['lax', 'strict', 'none'])

export function getEnvConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProd = nodeEnv === 'production'
  const isTest = nodeEnv === 'test'

  const port = Number(process.env.PORT) || 3001
  const mongoUri = (process.env.MONGODB_URI || '').trim()
  const sessionSecret = (process.env.SESSION_SECRET || '').trim()
  const frontendUrl = (
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ).replace(/\/+$/, '')

  const rawOrigins = (process.env.CORS_ORIGINS || frontendUrl)
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)

  const rawSameSite = (process.env.COOKIE_SAME_SITE || 'lax').trim().toLowerCase()
  const cookieSameSite = VALID_SAME_SITE.has(rawSameSite) ? rawSameSite : 'lax'

  const rawSecure = (process.env.COOKIE_SECURE || '').trim().toLowerCase()
  const cookieSecure =
    rawSecure === 'true'
      ? true
      : rawSecure === 'false'
        ? false
        : isProd || cookieSameSite === 'none'

  const rawTrustProxy = Number(process.env.TRUST_PROXY)
  const trustProxy =
    Number.isInteger(rawTrustProxy) && rawTrustProxy >= 0 && rawTrustProxy <= 5
      ? rawTrustProxy
      : isProd
        ? 1
        : 0

  const rawPool = Number(process.env.MONGO_MAX_POOL_SIZE)
  const mongoMaxPoolSize =
    Number.isInteger(rawPool) && rawPool >= 2 && rawPool <= 25 ? rawPool : 10

  if (isProd) {
    if (!mongoUri) {
      throw new Error('FATAL: MONGODB_URI is required in production.')
    }
    if (!sessionSecret || sessionSecret.length < 32) {
      throw new Error(
        'FATAL: SESSION_SECRET must be at least 32 characters in production.',
      )
    }
    if (rawOrigins.includes('*')) {
      throw new Error(
        'FATAL: Wildcard CORS origin (*) is forbidden with credentialed sessions.',
      )
    }
    if (cookieSameSite === 'none' && !cookieSecure) {
      throw new Error(
        'FATAL: COOKIE_SECURE=true is required when COOKIE_SAME_SITE=none.',
      )
    }
  }

  return {
    nodeEnv,
    isProd,
    isTest,
    port,
    mongoUri,
    sessionSecret:
      sessionSecret || 'dev-only-session-secret-change-in-production-32chars',
    frontendUrl,
    allowedOrigins: rawOrigins,
    sessionIdleTimeoutMs:
      Number(process.env.SESSION_IDLE_TIMEOUT_MS) || 30 * 60 * 1000, // 30m
    sessionMaxLifetimeMs:
      Number(process.env.SESSION_MAX_LIFETIME_MS) || 12 * 60 * 60 * 1000, // 12h
    cookieDomain: (process.env.COOKIE_DOMAIN || '').trim() || undefined,
    cookieSameSite,
    cookieSecure,
    trustProxy,
    mongoMaxPoolSize,
  }
}
