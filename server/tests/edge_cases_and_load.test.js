import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-edge-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOCAL_EVENTS_FILE = path.join(tmpDir, 'analyticsEvents.json')
process.env.LOCAL_BUSINESSES_FILE = path.join(tmpDir, 'businesses.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100'

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { hashPassword } = await import('../src/utils/password.js')

const ADMIN_EMAIL = 'edge-admin@reviewbuddy.test'
const ADMIN_PASS = 'EdgeCase#StrongPass1!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'Edge Admin',
  passwordHash: await hashPassword(ADMIN_PASS),
})

const app = createApp()

async function loginAsAdmin() {
  const agent = request.agent(app)
  const csrfRes = await agent.get('/api/auth/csrf')
  const loginRes = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfRes.body.csrfToken)
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  assert.equal(loginRes.status, 200)
  return { agent, csrfToken: loginRes.body.csrfToken }
}

test('Business management edge cases: optional fields, long strings, pause/activate, 404 delete, concurrent updates', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Edge Case Bistro',
      location: '',
      address: '',
      phone: '',
      email: '',
      googleReviewUrl: '',
      welcomeMessage: '',
    })
  assert.equal(created.status, 201)
  const id = created.body.business.publicId

  // Invalid Google Review URL rejected
  const badUrl = await agent
    .put(`/api/businesses/${id}`)
    .set('X-CSRF-Token', csrfToken)
    .send({ reviewConfig: { googleReviewUrl: 'not-a-valid-url' } })
  assert.equal(badUrl.status, 400)

  // Long name (>140) and long welcomeMessage (>400) rejected
  const longName = await agent
    .put(`/api/businesses/${id}`)
    .set('X-CSRF-Token', csrfToken)
    .send({ name: 'A'.repeat(150) })
  assert.equal(longName.status, 400)

  const longWelcome = await agent
    .put(`/api/businesses/${id}`)
    .set('X-CSRF-Token', csrfToken)
    .send({ reviewConfig: { welcomeMessage: 'W'.repeat(420) } })
  assert.equal(longWelcome.status, 400)

  // Pause and reactivate
  const paused = await agent
    .put(`/api/businesses/${id}`)
    .set('X-CSRF-Token', csrfToken)
    .send({ status: 'paused' })
  assert.equal(paused.status, 200)
  assert.equal(paused.body.business.status, 'paused')

  const activated = await agent
    .put(`/api/businesses/${id}`)
    .set('X-CSRF-Token', csrfToken)
    .send({ status: 'active' })
  assert.equal(activated.status, 200)
  assert.equal(activated.body.business.status, 'active')

  // Concurrent updates to same business complete without crash/corruption
  const [u1, u2] = await Promise.all([
    agent
      .put(`/api/businesses/${id}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ location: 'Mumbai', reviewConfig: { autoCopyPrompt: false } }),
    agent
      .put(`/api/businesses/${id}`)
      .set('X-CSRF-Token', csrfToken)
      .send({ phone: '+91 9876543210' }),
  ])
  assert.equal(u1.status, 200)
  assert.equal(u2.status, 200)

  // Delete non-existent business returns 404
  const delMissing = await agent
    .delete('/api/businesses/non-existent-biz-999')
    .set('X-CSRF-Token', csrfToken)
  assert.equal(delMissing.status, 404)
})

test('Customer flow edge cases: ratings 1..5, mixed sentiment, incomplete answers, autoCopyPrompt', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Rating Matrix Cafe',
      category: 'Café',
      reviewConfig: {
        googleReviewUrl: 'ChIJCcAieFGl1jsREQ6h9oXJa-8',
        autoCopyPrompt: false,
      },
      questions: [
        {
          id: 'q_staff',
          text: 'How was the staff?',
          type: 'single_choice',
          options: ['Excellent', 'Rude'],
          required: true,
        },
        {
          id: 'q_food',
          text: 'How was the coffee?',
          type: 'single_choice',
          options: ['Delicious', 'Cold'],
          required: false,
        },
      ],
    })
  assert.equal(created.status, 201)
  const publicId = created.body.business.publicId

  // Verify autoCopyPrompt=false persisted in public payload
  const pub = await request(app).get(`/api/public/businesses/${publicId}`)
  assert.equal(pub.status, 200)
  assert.equal(pub.body.business.reviewConfig.autoCopyPrompt, false)

  // Incomplete required answer rejected with 400
  const incomplete = await request(app)
    .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
    .send({ rating: 5, answers: { q_food: 'Delicious' } })
  assert.equal(incomplete.status, 400)

  // Test ratings 1..5
  for (let rating = 1; rating <= 5; rating += 1) {
    const res = await request(app)
      .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
      .send({
        rating,
        answers: {
          q_staff: rating >= 4 ? 'Excellent' : 'Rude',
          q_food: rating === 3 ? 'Delicious' : rating <= 2 ? 'Cold' : 'Delicious',
        },
      })
    assert.equal(res.status, 200)
    assert.equal(typeof res.body.draft, 'string')
    assert.ok(res.body.draft.length > 10)
  }

  // Mixed positive + negative answers preserve negative detail
  const mixed = await request(app)
    .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
    .send({
      rating: 3,
      answers: { q_staff: 'Excellent', q_food: 'Cold' },
    })
  assert.equal(mixed.status, 200)
  assert.match(mixed.body.draft.toLowerCase(), /cold/)
})

test('Malformed JSON and oversized (>256kb) request bodies are rejected cleanly', async () => {
  const badJson = await request(app)
    .post('/api/public/businesses/any-biz/events')
    .set('Content-Type', 'application/json')
    .send('{"event": "landingViews"')
  assert.equal(badJson.status, 400)

  const hugeBody = await request(app)
    .post('/api/public/businesses/any-biz/events')
    .send({ event: 'landingViews', padding: 'x'.repeat(300 * 1024) })
  assert.equal(hugeBody.status, 413)
})

test('Concurrent public reads and submissions across businesses succeed consistently', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const bizIds = []
  for (let i = 0; i < 3; i += 1) {
    const res = await agent
      .post('/api/businesses')
      .set('X-CSRF-Token', csrfToken)
      .send({
        name: `Concurrent Biz ${i}`,
        questions: [
          {
            id: 'q1',
            text: 'How was the service?',
            type: 'single_choice',
            options: ['Great', 'Slow'],
            required: true,
          },
        ],
      })
    assert.equal(res.status, 201)
    bizIds.push(res.body.business.publicId)
  }

  const tasks = []
  for (let i = 0; i < 18; i += 1) {
    const id = bizIds[i % bizIds.length]
    tasks.push(request(app).get(`/api/public/businesses/${id}`))
    tasks.push(
      request(app)
        .post(`/api/public/businesses/${id}/questionnaire/complete`)
        .send({ rating: 5, answers: { q1: 'Great' } }),
    )
  }

  const results = await Promise.all(tasks)
  for (const r of results) {
    assert.equal(r.status, 200)
  }
})
