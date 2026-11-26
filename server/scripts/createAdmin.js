import 'dotenv/config'
import readline from 'readline'
import { connectDatabase } from '../src/config/db.js'
import { countAdmins, createAdminRecord } from '../src/repositories/adminRepo.js'
import { hashPassword, validatePasswordComplexity } from '../src/utils/password.js'

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function run() {
  await connectDatabase()

  const existingCount = await countAdmins()
  if (existingCount > 0) {
    console.error(
      '[Setup Blocked] An administrator account already exists. Duplicate admin creation is disabled.',
    )
    process.exit(1)
  }

  const email = (
    process.env.INIT_ADMIN_EMAIL || (await prompt('Admin email: '))
  )
    .trim()
    .toLowerCase()

  const name = (
    process.env.INIT_ADMIN_NAME ||
    (await prompt('Admin name (default: Administrator): ')) ||
    'Administrator'
  ).trim()

  const password =
    process.env.INIT_ADMIN_PASSWORD || (await prompt('Admin password: '))

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('[Setup Error] A valid email address is required.')
    process.exit(1)
  }

  const complexityError = validatePasswordComplexity(password)
  if (complexityError) {
    console.error(`[Setup Error] Weak password: ${complexityError}`)
    process.exit(1)
  }

  const passwordHash = await hashPassword(password)
  const admin = await createAdminRecord({ email, name, passwordHash })

  console.log(
    `[Setup Complete] Administrator created: ${admin.email} (${admin.name})`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error('[Setup Error]', err.message)
  process.exit(1)
})
