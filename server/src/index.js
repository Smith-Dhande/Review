import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import businessRoutes from './routes/businessRoutes.js'
import publicRoutes from './routes/publicRoutes.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '4mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/businesses', businessRoutes)
app.use('/api/public', publicRoutes)

app.use((err, _req, res, _next) => {
  const status = err.status || 500
  const message =
    status < 500 ? err.message : 'Internal server error. Please try again.'
  if (status >= 500) {
    console.error('[Server Error]', err)
  }
  res.status(status).json({ message })
})

async function start() {
  await connectDatabase()
  app.listen(PORT, () => {
    console.log(`[Server] ReviewBuddy API running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('[Startup Error]', err)
  process.exit(1)
})
