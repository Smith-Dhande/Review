import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { getEnvConfig } from './config/environment.js'
import { initCloudinary } from './config/cloudinary.js'
import { createSessionMiddleware } from './config/session.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createAuthRouter } from './routes/authRoutes.js'
import businessRoutes from './routes/businessRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import { createUploadRouter } from './routes/uploadRoutes.js'

export function createApp() {
  const env = getEnvConfig()
  initCloudinary()
  const app = express()

  if (env.trustProxy) {
    app.set('trust proxy', env.trustProxy)
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: env.isProd
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
      contentSecurityPolicy: env.isProd
        ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://api.fontshare.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.fontshare.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
            connectSrc: ["'self'", ...env.allowedOrigins],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
          },
        }
        : false,
    }),
  )

  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server / supertest requests without Origin header
        if (!origin) return callback(null, true)
        const normalized = origin.replace(/\/+$/, '')
        if (env.allowedOrigins.includes(normalized)) {
          return callback(null, true)
        }
        return callback(new Error('CORS_NOT_ALLOWED'))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    }),
  )

  app.use(express.json({ limit: '256kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Public customer endpoints never touch admin session storage
  app.use('/api/public', publicRoutes)

  const sessionMiddleware = createSessionMiddleware(env)
  app.use('/api/auth', sessionMiddleware, createAuthRouter())
  app.use('/api/uploads', sessionMiddleware, createUploadRouter())
  app.use('/api/businesses', sessionMiddleware, businessRoutes)
  app.use('/api/analytics', sessionMiddleware, analyticsRoutes)

  app.use(errorHandler)

  return app
}
