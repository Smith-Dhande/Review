import { getEnvConfig } from '../config/environment.js'

export function errorHandler(err, _req, res, _next) {
  const env = getEnvConfig()
  const status = err.status || err.statusCode || 500

  // CORS origin rejection
  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ message: 'Origin not allowed.' })
  }

  if (status >= 500 && !env.isTest) {
    console.error('[Server Error]', err.message)
  }

  const safeMessage =
    status < 500
      ? err.message
      : 'Internal server error. Please try again later.'

  return res.status(status).json({ message: safeMessage })
}
