import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-v1-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOCAL_EVENTS_FILE = path.join(tmpDir, 'analyticsEvents.json')
process.env.LOCAL_BUSINESSES_FILE = path.join(tmpDir, 'businesses.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100'

const devBusinessesFile = path.resolve('src/data/businesses.json')
const devBusinessesBefore = fs.existsSync(devBusinessesFile)
  ? fs.readFileSync(devBusinessesFile, 'utf-8')
  : null

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { hashPassword } = await import('../src/utils/password.js')
const { setImageStorageAdapter } = await import('../src/services/imageStorageService.js')
const { getEnvConfig } = await import('../src/config/environment.js')

const ADMIN_EMAIL = 'v1-admin@reviewbuddy.test'
const ADMIN_PASS = 'V1Completion#Pass123!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'V1 Admin',
  passwordHash: await hashPassword(ADMIN_PASS),
})

const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])

let uploadIdx = 0
const deletedAssets = []
setImageStorageAdapter({
  async upload() {
    uploadIdx += 1
    const publicId = `reviewbuddy/businesses/logos/v1_temp_${uploadIdx}`
    return {
      url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.png`,
      publicId,
      format: 'png',
      width: 240,
      height: 120,
    }
  },
  async destroy(publicId) {
    deletedAssets.push(publicId)
    return true
  },
})

const app = createApp()

async function loginAdmin(customApp = app) {
  const agent = request.agent(customApp)
  const csrfRes = await agent.get('/api/auth/csrf')
  const loginRes = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrfRes.body.csrfToken)
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
  assert.equal(loginRes.status, 200)
  return { agent, csrf: loginRes.body.csrfToken }
}

test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  if (devBusinessesBefore !== null) {
    const devBusinessesAfter = fs.readFileSync(devBusinessesFile, 'utf-8')
    assert.equal(
      devBusinessesAfter,
      devBusinessesBefore,
      'Automated tests must NEVER modify server/src/data/businesses.json',
    )
  }
})

test('Pagination, search, status filtering, and query validation on GET /api/businesses', async () => {
  const { agent, csrf } = await loginAdmin()

  for (let i = 1; i <= 5; i += 1) {
    const res = await agent
      .post('/api/businesses')
      .set('X-CSRF-Token', csrf)
      .send({
        name: `Alpha Bistro ${i}`,
        category: i % 2 === 0 ? 'Café' : 'Restaurant',
        location: 'Mumbai',
        status: i === 5 ? 'paused' : 'active',
      })
    assert.equal(res.status, 201)
  }

  const page1 = await agent.get('/api/businesses?page=1&limit=2&search=Alpha&status=active')
  assert.equal(page1.status, 200)
  assert.equal(page1.body.businesses.length, 2)
  assert.equal(page1.body.pagination.page, 1)
  assert.equal(page1.body.pagination.limit, 2)
  assert.equal(page1.body.pagination.total, 4)
  assert.equal(page1.body.pagination.totalPages, 2)
  assert.equal(page1.body.pagination.hasNextPage, true)
  assert.equal(page1.body.counts.paused >= 1, true)

  const page2 = await agent.get('/api/businesses?page=2&limit=2&search=Alpha&status=active')
  assert.equal(page2.status, 200)
  assert.equal(page2.body.businesses.length, 2)
  assert.equal(page2.body.pagination.hasNextPage, false)
  assert.equal(page2.body.pagination.hasPrevPage, true)

  // Regex special character search does not crash
  const regexSafe = await agent.get('/api/businesses?search=.*%2B%3F%5B%5D')
  assert.equal(regexSafe.status, 200)

  // Invalid query parameters rejected
  const badLimit = await agent.get('/api/businesses?limit=999')
  assert.equal(badLimit.status, 400)
  const badStatus = await agent.get('/api/businesses?status=deleted')
  assert.equal(badStatus.status, 400)
})

test('Business rename preserves immutable publicId and qrPublicUrl; duplicate names get unique publicIds', async () => {
  const { agent, csrf } = await loginAdmin()

  const b1 = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Duplicate Cafe' })
  const b2 = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Duplicate Cafe' })
  assert.equal(b1.status, 201)
  assert.equal(b2.status, 201)
  assert.notEqual(b1.body.business.publicId, b2.body.business.publicId)

  const renamed = await agent
    .put(`/api/businesses/${b1.body.business.publicId}`)
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Renamed Cafe Forever' })
  assert.equal(renamed.status, 200)
  assert.equal(renamed.body.business.name, 'Renamed Cafe Forever')
  assert.equal(renamed.body.business.publicId, b1.body.business.publicId)
  assert.equal(renamed.body.business.qrPublicUrl, b1.body.business.qrPublicUrl)
})

test('Orphan logo upload cleanup deletes abandoned temp upload but protects saved business logos', async () => {
  const { agent, csrf } = await loginAdmin()

  // Upload temp logo 1 and cancel (delete temp)
  const up1 = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_PNG, { filename: 'temp1.png', contentType: 'image/png' })
  assert.equal(up1.status, 201)
  const tempId1 = up1.body.logo.publicId

  const clean1 = await agent
    .delete('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .send({ publicId: tempId1 })
  assert.equal(clean1.status, 200)
  assert.equal(clean1.body.deleted, true)
  assert(deletedAssets.includes(tempId1))

  // Upload logo 2 and save to a business
  const up2 = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_PNG, { filename: 'saved2.png', contentType: 'image/png' })
  assert.equal(up2.status, 201)
  const savedLogo = up2.body.logo

  const bizRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Logo Guard Cafe', logo: savedLogo })
  assert.equal(bizRes.status, 201)

  // Attempt to clean up saved business logo -> must be rejected and NOT deleted
  const tryDeleteSaved = await agent
    .delete('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .send({ publicId: savedLogo.publicId })
  assert([403, 409].includes(tryDeleteSaved.status))
  assert.equal(deletedAssets.includes(savedLogo.publicId), false)

  // Invalid publicId rejected
  const invalidPid = await agent
    .delete('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .send({ publicId: '../evil/path' })
  assert.equal(invalidPid.status, 400)
})

test('GET /api/analytics/business/:businessId supports ranges, rating distribution, and validates inputs', async () => {
  const unauth = await request(app).get('/api/analytics/business/chai-junction')
  assert.equal(unauth.status, 401)

  const { agent, csrf } = await loginAdmin()

  const bizRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({
      name: 'Analytics Detail Bistro',
      googleReviewUrl: 'https://g.page/r/detail-bistro/review',
      questions: [
        {
          id: 'q-d1',
          text: 'How was the food?',
          type: 'single_choice',
          required: true,
          options: ['Delicious', 'Cold'],
        },
        {
          id: 'q-d2',
          text: 'Additional comments?',
          type: 'short_text',
          required: false,
          options: [],
        },
      ],
    })
  assert.equal(bizRes.status, 201)
  const pid = bizRes.body.business.publicId

  // Empty analytics baseline
  const emptyStats = await agent.get(`/api/analytics/business/${pid}?range=7d`)
  assert.equal(emptyStats.status, 200)
  assert.equal(emptyStats.body.stats.landingViews, 0)
  assert.equal(emptyStats.body.activity.length, 7)

  // Invalid range / custom dates / bad ID
  assert.equal((await agent.get(`/api/analytics/business/${pid}?range=999d`)).status, 400)
  assert.equal(
    (await agent.get(`/api/analytics/business/${pid}?range=custom&from=2026-11-20&to=2026-11-01`)).status,
    400,
  )
  assert.equal((await agent.get('/api/analytics/business/bad$id!')).status, 400)
  assert.equal((await agent.get('/api/analytics/business/does-not-exist-999')).status, 404)

  // Simulate two customer journeys (1-star and 5-star) -> both get Google Review URL equally
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'landingViews' })
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'initialRating', rating: 1 })
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'questionnaireStarts' })
  const lowDraft = await request(app)
    .post(`/api/public/businesses/${pid}/questionnaire/complete`)
    .send({ rating: 1, answers: { 'q-d1': 'Cold' } })
  assert.equal(lowDraft.status, 200)
  assert.match(lowDraft.body.draft, /cold|fell short|not satisfied|did not go/i)

  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'landingViews' })
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'initialRating', rating: 5 })
  const highDraft = await request(app)
    .post(`/api/public/businesses/${pid}/questionnaire/complete`)
    .send({ rating: 5, answers: { 'q-d1': 'Delicious', 'q-d2': 'Loved the dessert!' } })
  assert.equal(highDraft.status, 200)
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'copyClicks' })
  await request(app).post(`/api/public/businesses/${pid}/events`).send({ event: 'googleReviewRedirects' })

  const bStats = await agent.get(`/api/analytics/business/${pid}?range=30d`)
  assert.equal(bStats.status, 200)
  assert.equal(bStats.body.stats.landingViews, 2)
  assert.equal(bStats.body.stats.totalInitialRatings, 2)
  assert.equal(bStats.body.stats.averageInitialRating, 3)
  assert.equal(bStats.body.stats.ratingDistribution['1'], 1)
  assert.equal(bStats.body.stats.ratingDistribution['5'], 1)
  assert.equal(bStats.body.stats.questionnaireCompletions, 2)
  assert.equal(bStats.body.stats.reviewDraftsGenerated, 2)
  assert.equal(bStats.body.stats.copyClicks, 1)
  assert.equal(bStats.body.stats.googleReviewRedirects, 1)
  assert.equal(bStats.body.activity.length, 30)

  // Dashboard overview includes date-filtered businessPerformance & businessCounts
  const ov = await agent.get('/api/analytics/overview?range=7d')
  assert.equal(ov.status, 200)
  assert.ok(ov.body.businessCounts.total >= 1)
  const perfRow = ov.body.businessPerformance.find((r) => r.publicId === pid)
  assert.ok(perfRow)
  assert.equal(perfRow.rangeStats.landingViews, 2)
  assert.equal(perfRow.rangeStats.googleReviewRedirects, 1)
})

test('Cross-origin SameSite=None + Secure cookie config, Referer check, and prod guards', async () => {
  const prevSameSite = process.env.COOKIE_SAME_SITE
  const prevSecure = process.env.COOKIE_SECURE
  const prevNodeEnv = process.env.NODE_ENV
  const prevMongo = process.env.MONGODB_URI
  const prevTrust = process.env.TRUST_PROXY

  try {
    // Prod guard: SameSite=None without Secure=true throws
    process.env.NODE_ENV = 'production'
    process.env.MONGODB_URI = 'mongodb://localhost:27017/dummy'
    process.env.COOKIE_SAME_SITE = 'none'
    process.env.COOKIE_SECURE = 'false'
    assert.throws(() => getEnvConfig(), /COOKIE_SECURE=true/)

    // Test SameSite=None + Secure=true cookie attributes behind HTTPS reverse proxy
    process.env.NODE_ENV = 'test'
    delete process.env.MONGODB_URI
    process.env.COOKIE_SAME_SITE = 'none'
    process.env.COOKIE_SECURE = 'true'
    process.env.TRUST_PROXY = '1'

    const crossApp = createApp()
    const csrfRes = await request(crossApp)
      .get('/api/auth/csrf')
      .set('X-Forwarded-Proto', 'https')
    assert.equal(csrfRes.status, 200)
    const csrfCookie = (csrfRes.headers['set-cookie'] || [])
      .map((c) => c.split(';')[0])
      .join('; ')
    assert.ok(csrfCookie.includes('rb.sid='))

    // Disallowed Referer rejected even without Origin header
    const badReferer = await request(crossApp)
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .set('Cookie', csrfCookie)
      .set('Referer', 'https://attacker.example/phish')
      .set('X-CSRF-Token', csrfRes.body.csrfToken)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    assert.equal(badReferer.status, 403)

    const loginRes = await request(crossApp)
      .post('/api/auth/login')
      .set('X-Forwarded-Proto', 'https')
      .set('Cookie', csrfCookie)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrfRes.body.csrfToken)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
    assert.equal(loginRes.status, 200)
    const setCookies = loginRes.headers['set-cookie']?.join(';') || ''
    assert.match(setCookies, /SameSite=None/i)
    assert.match(setCookies, /Secure/i)
    assert.match(setCookies, /HttpOnly/i)

    // Logout clears cookie with matching SameSite=None; Secure; HttpOnly attributes
    const sessionCookie = (loginRes.headers['set-cookie'] || [])
      .map((c) => c.split(';')[0])
      .join('; ')
    const logoutRes = await request(crossApp)
      .post('/api/auth/logout')
      .set('X-Forwarded-Proto', 'https')
      .set('Cookie', sessionCookie)
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
    assert.equal(logoutRes.status, 200)
    const clearCookies = logoutRes.headers['set-cookie']?.join(';') || ''
    assert.match(clearCookies, /SameSite=None/i)
    assert.match(clearCookies, /Secure/i)
  } finally {
    if (prevSameSite === undefined) delete process.env.COOKIE_SAME_SITE
    else process.env.COOKIE_SAME_SITE = prevSameSite
    if (prevSecure === undefined) delete process.env.COOKIE_SECURE
    else process.env.COOKIE_SECURE = prevSecure
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = prevNodeEnv
    if (prevMongo === undefined) delete process.env.MONGODB_URI
    else process.env.MONGODB_URI = prevMongo
    if (prevTrust === undefined) delete process.env.TRUST_PROXY
    else process.env.TRUST_PROXY = prevTrust
  }
})

test('QR endpoint upgrades legacy localhost qrPublicUrl when FRONTEND_URL is production', async () => {
  const { agent, csrf } = await loginAdmin()
  const created = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Localhost Upgrade Cafe' })
  assert.equal(created.status, 201)
  const pid = created.body.business.publicId
  assert.match(created.body.business.qrPublicUrl, /^http:\/\/localhost:5173\/review\//)

  const prevFrontend = process.env.FRONTEND_URL
  try {
    process.env.FRONTEND_URL = 'https://reviews.example.com'
    const qrRes = await agent.get(`/api/businesses/${pid}/qr?format=json`)
    assert.equal(qrRes.status, 200)
    assert.equal(qrRes.body.qrPublicUrl, `https://reviews.example.com/review/${pid}`)
  } finally {
    if (prevFrontend === undefined) delete process.env.FRONTEND_URL
    else process.env.FRONTEND_URL = prevFrontend
  }
})
