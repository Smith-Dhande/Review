import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

// Isolated test environment before importing app/repos
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-auth-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100' // High for general tests; dedicated rate-limit test below

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { hashPassword } = await import('../src/utils/password.js')

const TEST_EMAIL = 'admin@reviewbuddy.test'
const INITIAL_PASSWORD = 'Initial#StrongPassword1!'
const NEW_PASSWORD = 'Rotated#StrongPassword2@'

// Seed isolated test admin with Argon2id
const initialHash = await hashPassword(INITIAL_PASSWORD)
await createAdminRecord({
  email: TEST_EMAIL,
  name: 'Security Admin',
  passwordHash: initialHash,
})

const app = createApp()

async function getCsrf(agent) {
  const res = await agent.get('/api/auth/csrf')
  assert.equal(res.status, 200)
  assert(res.body.csrfToken)
  return res.body.csrfToken
}

test('11. Passwords are stored only as Argon2id hashes and never returned', async () => {
  const rawAdmins = JSON.parse(
    fs.readFileSync(process.env.LOCAL_ADMIN_FILE, 'utf-8'),
  )
  assert.equal(rawAdmins.length, 1)
  assert(rawAdmins[0].passwordHash.startsWith('$argon2id$'))
  assert.notEqual(rawAdmins[0].passwordHash, INITIAL_PASSWORD)
})

test('15. Public administrator registration endpoints do not exist', async () => {
  const r1 = await request(app).post('/api/auth/register').send({
    email: 'hacker@evil.com',
    password: 'Strong#Password123',
  })
  const r2 = await request(app).post('/api/auth/signup').send({
    email: 'hacker@evil.com',
    password: 'Strong#Password123',
  })
  assert.equal(r1.status, 404)
  assert.equal(r2.status, 404)
})

test('4 & 14. Unauthenticated users cannot access protected admin APIs', async () => {
  const meRes = await request(app).get('/api/auth/me')
  assert.equal(meRes.status, 401)

  const bizRes = await request(app).get('/api/businesses')
  assert.equal(bizRes.status, 401)

  const createRes = await request(app)
    .post('/api/businesses')
    .send({ name: 'Unauthorized Biz' })
  assert([401, 403].includes(createRes.status))
})

test('13. Public customer review routes remain accessible without login', async () => {
  const res = await request(app).get('/api/public/businesses/chai-junction')
  assert.equal(res.status, 200)
  assert.equal(res.body.business.publicId, 'chai-junction')
  assert.equal(res.body.business.email, undefined)
})

test('8. Invalid or missing CSRF tokens are rejected', async () => {
  const agent = request.agent(app)
  await getCsrf(agent)

  const missingCsrf = await agent
    .post('/api/auth/login')
    .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
  assert.equal(missingCsrf.status, 403)

  const badCsrf = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', 'invalid-token-value')
    .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
  assert.equal(badCsrf.status, 403)
})

test('9. Requests from unauthorized origins are rejected', async () => {
  const res = await request(app)
    .get('/api/auth/csrf')
    .set('Origin', 'https://evil-attacker.example')
  assert.equal(res.status, 403)
})

test('2 & 3. Incorrect credentials are rejected without revealing account existence', async () => {
  const agent = request.agent(app)
  const csrf = await getCsrf(agent)

  const unknownEmail = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email: 'nobody@nonexistent.example', password: INITIAL_PASSWORD })
  assert.equal(unknownEmail.status, 401)

  const wrongPassword = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email: TEST_EMAIL, password: 'WrongPassword!123' })
  assert.equal(wrongPassword.status, 401)

  assert.equal(unknownEmail.body.message, wrongPassword.body.message)
})

test('1, 5 & 6. Valid login sets HttpOnly cookie, grants admin access, and logout invalidates session', async () => {
  const agent = request.agent(app)
  const csrf = await getCsrf(agent)

  const loginRes = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
  assert.equal(loginRes.status, 200)
  assert.equal(loginRes.body.user.email, TEST_EMAIL)
  assert.equal(loginRes.body.user.passwordHash, undefined)

  const setCookie = loginRes.headers['set-cookie']?.join(';') || ''
  assert(setCookie.includes('HttpOnly'), 'Session cookie must be HttpOnly')
  assert(setCookie.includes('SameSite=Lax'), 'Session cookie must be SameSite=Lax')

  const meRes = await agent.get('/api/auth/me')
  assert.equal(meRes.status, 200)
  assert.equal(meRes.body.user.email, TEST_EMAIL)

  const bizRes = await agent.get('/api/businesses')
  assert.equal(bizRes.status, 200)
  assert(Array.isArray(bizRes.body.businesses))

  const nextCsrf = meRes.body.csrfToken
  const logoutRes = await agent
    .post('/api/auth/logout')
    .set('X-CSRF-Token', nextCsrf)
  assert.equal(logoutRes.status, 200)

  const meAfterLogout = await agent.get('/api/auth/me')
  assert.equal(meAfterLogout.status, 401)
})

test('7. Expired sessions are rejected', async () => {
  const prevLifetime = process.env.SESSION_MAX_LIFETIME_MS
  process.env.SESSION_MAX_LIFETIME_MS = '50'
  try {
    const shortApp = createApp()
    const agent = request.agent(shortApp)
    const csrfRes = await agent.get('/api/auth/csrf')
    const loginRes = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrfRes.body.csrfToken)
      .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
    assert.equal(loginRes.status, 200)

    await new Promise((r) => setTimeout(r, 80))

    const meRes = await agent.get('/api/auth/me')
    assert.equal(meRes.status, 401)
  } finally {
    if (prevLifetime === undefined) delete process.env.SESSION_MAX_LIFETIME_MS
    else process.env.SESSION_MAX_LIFETIME_MS = prevLifetime
  }
})

test('12. Password change invalidates previous sessions', async () => {
  const agentA = request.agent(app)
  const agentB = request.agent(app)

  const csrfA = await getCsrf(agentA)
  const loginA = await agentA
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfA)
    .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
  assert.equal(loginA.status, 200)

  const csrfB = await getCsrf(agentB)
  const loginB = await agentB
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfB)
    .send({ email: TEST_EMAIL, password: INITIAL_PASSWORD })
  assert.equal(loginB.status, 200)

  // Agent A changes password
  const cpRes = await agentA
    .post('/api/auth/change-password')
    .set('X-CSRF-Token', loginA.body.csrfToken)
    .send({
      currentPassword: INITIAL_PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    })
  assert.equal(cpRes.status, 200)

  // Agent A's rotated session still works
  const meA = await agentA.get('/api/auth/me')
  assert.equal(meA.status, 200)

  // Agent B's previous session is invalidated
  const meB = await agentB.get('/api/auth/me')
  assert.equal(meB.status, 401)
})

test('10. Repeated login attempts are rate-limited', async () => {
  const prevMax = process.env.LOGIN_RATE_LIMIT_MAX
  process.env.LOGIN_RATE_LIMIT_MAX = '3'
  try {
    const limitedApp = createApp()
    const agent = request.agent(limitedApp)
    const csrfRes = await agent.get('/api/auth/csrf')
    const csrf = csrfRes.body.csrfToken

    for (let i = 0; i < 3; i++) {
      await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', csrf)
        .send({ email: 'nobody@test.example', password: 'wrong' })
    }

    const blocked = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ email: 'nobody@test.example', password: 'wrong' })
    assert.equal(blocked.status, 429)
  } finally {
    if (prevMax === undefined) delete process.env.LOGIN_RATE_LIMIT_MAX
    else process.env.LOGIN_RATE_LIMIT_MAX = prevMax
  }
})
