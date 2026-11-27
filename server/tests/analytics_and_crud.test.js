import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-phase4-test-'))
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
const { hashPassword } = await import('../src/utils/password.js')
const { setImageStorageAdapter } = await import(
  '../src/services/imageStorageService.js'
)

const ADMIN_EMAIL = 'phase4-admin@reviewbuddy.test'
const ADMIN_PASS = 'Phase4#StrongPassword1!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'Phase4 Admin',
  passwordHash: await hashPassword(ADMIN_PASS),
})

const deletedAssets = []
setImageStorageAdapter({
  async upload() {
    return {
      url: 'https://res.cloudinary.com/demo/image/upload/v1/reviewbuddy/businesses/logos/p4.png',
      publicId: 'reviewbuddy/businesses/logos/p4',
      format: 'png',
      width: 200,
      height: 200,
    }
  },
  async destroy(publicId) {
    deletedAssets.push(publicId)
    return true
  },
})

const app = createApp()

async function loginAdmin() {
  const agent = request.agent(app)
  const csrfRes = await agent.get('/api/auth/csrf')
  const loginRes = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfRes.body.csrfToken)
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  assert.equal(loginRes.status, 200)
  return { agent, csrf: loginRes.body.csrfToken }
}

test('Analytics overview requires auth and records real-time public events across ranges', async () => {
  const unauth = await request(app).get('/api/analytics/overview')
  assert.equal(unauth.status, 401)

  const { agent, csrf } = await loginAdmin()

  // Create a test business
  const bizRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({
      name: 'Analytics Cafe',
      category: 'Café',
      logo: {
        url: 'https://res.cloudinary.com/demo/image/upload/v1/reviewbuddy/businesses/logos/p4.png',
        publicId: 'reviewbuddy/businesses/logos/p4',
        format: 'png',
        width: 200,
        height: 200,
      },
      questions: [
        {
          id: 'q-a1',
          text: 'How was the staff behaviour?',
          category: 'staff_behaviour',
          type: 'single_choice',
          required: true,
          options: ['Very friendly'],
        },
      ],
    })
  assert.equal(bizRes.status, 201)
  const publicId = bizRes.body.business.publicId

  // Trigger real public events
  await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'totalScans' })
  await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'landingViews' })
  await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'initialRating', rating: 5 })
  await request(app)
    .post(`/api/public/businesses/${publicId}/questionnaire/complete`)
    .send({ rating: 5, answers: { 'q-a1': 'Very friendly' } })
  await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'copyClicks' })
  await request(app)
    .post(`/api/public/businesses/${publicId}/events`)
    .send({ event: 'googleReviewRedirects' })

  const ov7 = await agent.get('/api/analytics/overview?range=7d')
  assert.equal(ov7.status, 200)
  assert.equal(ov7.body.stats.totalScans, 1)
  assert.equal(ov7.body.stats.totalInitialRatings, 1)
  assert.equal(ov7.body.stats.averageInitialRating, 5)
  assert.equal(ov7.body.stats.questionnaireCompletions, 1)
  assert.equal(ov7.body.stats.reviewDraftsGenerated, 1)
  assert.equal(ov7.body.stats.copyClicks, 1)
  assert.equal(ov7.body.stats.googleReviewRedirects, 1)
  assert.equal(ov7.body.scanActivity.length, 7)

  const ov30 = await agent.get('/api/analytics/overview?range=30d')
  assert.equal(ov30.status, 200)
  assert.equal(ov30.body.scanActivity.length, 30)

  // Delete business -> deletes DB record, events, and Cloudinary asset
  const delRes = await agent
    .delete(`/api/businesses/${publicId}`)
    .set('X-CSRF-Token', csrf)
  assert.equal(delRes.status, 200)
  assert(deletedAssets.includes('reviewbuddy/businesses/logos/p4'))

  const afterDelOv = await agent.get('/api/analytics/overview?range=7d')
  assert.equal(afterDelOv.body.stats.totalScans, 0)
})

test('Zod validation rejects invalid business and public event payloads', async () => {
  const { agent, csrf } = await loginAdmin()

  const badBiz = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({ name: '' })
  assert.equal(badBiz.status, 400)

  const badEvent = await request(app)
    .post('/api/public/businesses/chai-junction/events')
    .send({ event: 'unknownEvent' })
  assert.equal(badEvent.status, 400)
})

test('Admin profile update and business export work', async () => {
  const { agent, csrf } = await loginAdmin()

  const patchRes = await agent
    .patch('/api/auth/me')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Smith Admin', emailNotifications: false })
  assert.equal(patchRes.status, 200)
  assert.equal(patchRes.body.user.name, 'Smith Admin')
  assert.equal(patchRes.body.user.emailNotifications, false)

  const exportRes = await agent.get('/api/businesses/export')
  assert.equal(exportRes.status, 200)
  assert(exportRes.headers['content-disposition'].includes('reviewbuddy-businesses-export.json'))
  const parsed = JSON.parse(exportRes.text)
  assert(Array.isArray(parsed.businesses))
})
