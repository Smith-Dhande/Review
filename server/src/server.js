import 'dotenv/config'
import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'
import { getEnvConfig } from './config/environment.js'

async function start() {
  const env = getEnvConfig()
  await connectDatabase()
  const app = createApp()

  app.listen(env.port, () => {
    console.log(
      `[Server] ReviewBuddy API running on http://localhost:${env.port} (${env.nodeEnv})`,
    )
  })
}

start().catch((err) => {
  console.error('[Startup Error]', err.message)
  process.exit(1)
})
