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
import { createUploadRouter } from './routes/uploadRoutes.js'

export function createApp() {
  const env = getEnvConfig()
  initCloudinary()
  const app = express()

  if (env.isProd) {
    app.set('trust proxy', 1)
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://api.fontshare.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.fontshare.com', 'data:'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
              connectSrc: ["'self'", ...env.allowedOrigins],
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

  app.use(express.json({ limit: '4mb' }))
  app.use(createSessionMiddleware(env))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', createAuthRouter())
  app.use('/api/uploads', createUploadRouter())
  app.use('/api/businesses', businessRoutes)
  app.use('/api/public', publicRoutes)

  app.use(errorHandler)

  return app
}
