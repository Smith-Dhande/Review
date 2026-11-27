import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'
import { getEnvConfig } from './config/environment.js'

async function start() {
  const env = getEnvConfig()
  await connectDatabase()
  const app = createApp()

  const server = app.listen(env.port, () => {
    console.log(
      `[Server] ReviewBuddy API running on http://localhost:${env.port} (${env.nodeEnv})`,
    )
  })

  server.requestTimeout = 30000
  server.headersTimeout = 35000

  const shutdown = (signal) => {
    console.log(`[Server] ${signal} received, shutting down gracefully...`)
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    console.error(
      '[Unhandled Rejection]',
      reason instanceof Error ? reason.message : String(reason),
    )
  })
}

start().catch((err) => {
  console.error('[Startup Error]', err.message)
  process.exit(1)
})
