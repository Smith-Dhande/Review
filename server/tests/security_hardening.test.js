import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-sec-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOCAL_EVENTS_FILE = path.join(tmpDir, 'analyticsEvents.json')
process.env.LOCAL_BUSINESSES_FILE = path.join(tmpDir, 'businesses.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100'

test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { normalizeGoogleReviewUrl } = await import(
  '../src/repositories/businessRepo.js'
)
const { hashPassword } = await import('../src/utils/password.js')

const ADMIN_EMAIL = 'sec-admin@reviewbuddy.test'
const ADMIN_PASS = 'SecAudit#StrongPass1!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'Sec Admin',
  passwordHash: await hashPassword(ADMIN_PASS),
})

const app = createApp()

async function loginAsAdmin() {
  const agent = request.agent(app)
  const csrfRes = await agent.get('/api/auth/csrf')
  const csrfToken = csrfRes.body.csrfToken
  const loginRes = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfToken)
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  assert.equal(loginRes.status, 200)
  return { agent, csrfToken: loginRes.body.csrfToken }
}

test('Rejects javascript: and data: URLs in googleReviewUrl and normalizes Place IDs', async () => {
  assert.equal(normalizeGoogleReviewUrl('javascript:alert(1)'), '')
  assert.equal(normalizeGoogleReviewUrl('data:text/html,<script>1</script>'), '')
  assert.equal(
    normalizeGoogleReviewUrl('ChIJCcAieFGl1jsREQ6h9oXJa-8'),
    'https://search.google.com/local/writereview?placeid=ChIJCcAieFGl1jsREQ6h9oXJa-8',
  )

  const { agent, csrfToken } = await loginAsAdmin()

  const badRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'XSS Test Cafe',
      googleReviewUrl: 'javascript:alert(document.cookie)',
    })
  assert.equal(badRes.status, 400)

  const okRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'PlaceId Test Cafe',
      googleReviewUrl: 'ChIJCcAieFGl1jsREQ6h9oXJa-8',
      questions: [
        {
          id: 'q1',
          text: 'How was the coffee?',
          type: 'single_choice',
          options: ['Great', 'Average'],
          required: true,
        },
      ],
    })
  assert.equal(okRes.status, 201)
  assert.equal(
    okRes.body.business.reviewConfig.googleReviewUrl,
    'https://search.google.com/local/writereview?placeid=ChIJCcAieFGl1jsREQ6h9oXJa-8',
  )
})

test('Rejects invalid :id path params, oversized classify-question, and oversized answers', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const badIdAdmin = await agent.get('/api/businesses/$ne-bad!id')
  assert.equal(badIdAdmin.status, 400)

  const badIdPublic = await request(app).get('/api/public/businesses/$ne-bad!id')
  assert.equal(badIdPublic.status, 400)

  const oversizedClassify = await agent
    .post('/api/businesses/classify-question')
    .set('X-CSRF-Token', csrfToken)
    .send({ text: 'a'.repeat(450) })
  assert.equal(oversizedClassify.status, 400)

  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({ name: 'Answers Cap Biz' })
  assert.equal(created.status, 201)
  const publicId = created.body.business.publicId

  const tooManyAnswers = {}
  for (let i = 0; i < 65; i += 1) {
    tooManyAnswers[`q${i}`] = 'ok'
  }
  const ansRes = await request(app)
    .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
    .send({ answers: tooManyAnswers, rating: 5 })
  assert.equal(ansRes.status, 400)
})

test('Paused business hides config on public GET and blocks questionnaire completion', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Paused Sec Biz',
      status: 'paused',
      googleReviewUrl: 'https://g.page/r/test/review',
    })
  assert.equal(created.status, 201)
  const publicId = created.body.business.publicId

  const pubGet = await request(app).get(`/api/public/businesses/${publicId}`)
  assert.equal(pubGet.status, 200)
  assert.equal(pubGet.body.business.status, 'paused')
  assert.equal(pubGet.body.business.reviewConfig, undefined)
  assert.equal(pubGet.body.business.questions, undefined)

  const pubComplete = await request(app)
    .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
    .send({ answers: {}, rating: 5 })
  assert.equal(pubComplete.status, 403)
})

test('Rejects NoSQL operator payloads on login and sets security headers', async () => {
  const csrfRes = await request(app).get('/api/auth/csrf')
  assert.equal(csrfRes.headers['x-content-type-options'], 'nosniff')
  assert.equal(
    csrfRes.headers['referrer-policy'],
    'strict-origin-when-cross-origin',
  )

  const agent = request.agent(app)
  const c = await agent.get('/api/auth/csrf')
  const nosqlLogin = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', c.body.csrfToken)
    .send({ email: { $ne: '' }, password: { $gt: '' } })
  assert.equal(nosqlLogin.status, 400)
})

test('Validates change-password complexity, questionnaire updates, and public event allowlist under Zod v4', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  // Weak new password rejected via superRefine
  const weakPw = await agent
    .post('/api/auth/change-password')
    .set('X-CSRF-Token', csrfToken)
    .send({
      currentPassword: ADMIN_PASS,
      newPassword: 'short',
      confirmPassword: 'short',
    })
  assert.equal(weakPw.status, 400)

  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({ name: 'Zod4 Validation Biz' })
  assert.equal(created.status, 201)
  const publicId = created.body.business.publicId

  // Invalid questionnaire structure rejected
  const badQ = await agent
    .put(`/api/businesses/${publicId}/questions`)
    .set('X-CSRF-Token', csrfToken)
    .send({ questions: [{ text: '' }] })
  assert.equal(badQ.status, 400)

  // Invalid public event type & out-of-range rating rejected
  const badEvent = await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'adminOverride', rating: 5 })
  assert.equal(badEvent.status, 400)

  const badRating = await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'initialRating', rating: 9 })
  assert.equal(badRating.status, 400)

  // Rate limiting on /events (30/min) returns 429 on burst
  let hit429 = false
  for (let i = 0; i < 32; i += 1) {
    const evRes = await request(app)
      .post(`/api/public/businesses/${publicId}/events`)
      .send({ event: 'landingViews' })
    if (evRes.status === 429) {
      hit429 = true
      break
    }
  }
  assert.equal(hit429, true)
})
