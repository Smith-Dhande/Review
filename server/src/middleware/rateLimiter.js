import rateLimit from 'express-rate-limit'

export function createLoginRateLimiter() {
  const maxAttempts = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10
  const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000

  return rateLimit({
    windowMs,
    max: maxAttempts,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many login attempts. Please wait a few minutes and try again.',
    },
  })
}

export function createPublicRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 90,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests. Please wait a moment and try again.',
    },
  })
}
