import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-cloudinary-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100'

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { hashPassword } = await import('../src/utils/password.js')
const { setImageStorageAdapter } = await import(
  '../src/services/imageStorageService.js'
)
const { normalizeLogo } = await import('../src/repositories/businessRepo.js')

const ADMIN_EMAIL = 'cloudinary-admin@reviewbuddy.test'
const ADMIN_PASS = 'Cloudinary#Strong1!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'Cloudinary Admin',
  passwordHash: await hashPassword(ADMIN_PASS),
})

const app = createApp()

// Minimal valid magic-byte buffers for PNG, JPEG, WebP
const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])
const VALID_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
])
const VALID_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
])

const deletedPublicIds = []
let uploadCounter = 0
let failNextUpload = false

setImageStorageAdapter({
  async upload(_buffer, options) {
    if (failNextUpload) {
      failNextUpload = false
      const err = new Error('Simulated Cloudinary outage')
      err.status = 502
      throw err
    }
    uploadCounter += 1
    const format = options.format || 'png'
    const publicId = `reviewbuddy/businesses/logos/test_logo_${uploadCounter}`
    return {
      url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.${format}`,
      publicId,
      format,
      width: 640,
      height: 320,
    }
  },
  async destroy(publicId) {
    deletedPublicIds.push(publicId)
    return true
  },
})

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

test('5 & 6. Unauthenticated upload and public image modifications are rejected', async () => {
  const res = await request(app)
    .post('/api/uploads/logo')
    .attach('logo', VALID_PNG, { filename: 'logo.png', contentType: 'image/png' })
  assert([401, 403].includes(res.status))

  const modRes = await request(app)
    .put('/api/businesses/chai-junction')
    .send({ logo: { url: 'https://evil.example/a.png' } })
  assert([401, 403].includes(modRes.status))
})

test('1, 2 & 7. Admin can upload PNG, JPG, and WebP logos and receive Cloudinary metadata', async () => {
  const { agent, csrf } = await loginAdmin()

  const pngRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_PNG, { filename: 'logo.png', contentType: 'image/png' })
  assert.equal(pngRes.status, 201)
  assert(pngRes.body.logo.url.startsWith('https://res.cloudinary.com/'))
  assert(pngRes.body.logo.publicId.startsWith('reviewbuddy/'))
  assert.equal(pngRes.body.logo.format, 'png')
  assert.equal(pngRes.body.logo.width, 640)

  const jpgRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_JPEG, { filename: 'logo.jpg', contentType: 'image/jpeg' })
  assert.equal(jpgRes.status, 201)
  assert.equal(jpgRes.body.logo.format, 'jpeg')

  const webpRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_WEBP, { filename: 'logo.webp', contentType: 'image/webp' })
  assert.equal(webpRes.status, 201)
  assert.equal(webpRes.body.logo.format, 'webp')
})

test('3 & 4. Oversized images and disguised/SVG files are rejected', async () => {
  const { agent, csrf } = await loginAdmin()

  // Oversized (> 5 MB)
  const bigBuffer = Buffer.concat([VALID_PNG, Buffer.alloc(5 * 1024 * 1024 + 10)])
  const bigRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', bigBuffer, { filename: 'huge.png', contentType: 'image/png' })
  assert.equal(bigRes.status, 413)

  // Disguised text file claiming to be image/png
  const fakePng = Buffer.from('not actually a png file at all', 'utf-8')
  const fakeRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', fakePng, { filename: 'fake.png', contentType: 'image/png' })
  assert.equal(fakeRes.status, 400)

  // Disallowed SVG
  const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  const svgRes = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', svgBuf, { filename: 'logo.svg', contentType: 'image/svg+xml' })
  assert.equal(svgRes.status, 400)
})

test('8. Database normalizer rejects base64 data URIs and stores only URL/metadata', () => {
  const sanitized = normalizeLogo({
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    publicId: 'reviewbuddy/bad',
  })
  assert.equal(sanitized.url, '')
  assert.equal(sanitized.publicId, '')
})

test('9, 10, 11, 12 & 13. Logo lifecycle: create, replace, Cloudinary failure safety, public payload, and delete', async () => {
  const { agent, csrf } = await loginAdmin()

  // Upload Logo 1
  const up1 = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_PNG, { filename: 'l1.png', contentType: 'image/png' })
  const logo1 = up1.body.logo

  // Create business with Logo 1
  const createRes = await agent
    .post('/api/businesses')
    .set('X-CSRF-Token', csrf)
    .send({
      name: 'Cloud Bistro',
      category: 'Restaurant',
      logo: logo1,
    })
  assert.equal(createRes.status, 201)
  const bizId = createRes.body.business.publicId

  // Verify public landing API exposes logo.url but hides internal publicId
  const pub1 = await request(app).get(`/api/public/businesses/${bizId}`)
  assert.equal(pub1.status, 200)
  assert.equal(pub1.body.business.logo.url, logo1.url)
  assert.equal(pub1.body.business.logo.publicId, undefined)

  // Simulate Cloudinary failure -> upload returns 502 and business retains Logo 1
  failNextUpload = true
  const failedUp = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_JPEG, { filename: 'l2.jpg', contentType: 'image/jpeg' })
  assert.equal(failedUp.status, 502)

  const checkBiz = await agent.get(`/api/businesses/${bizId}`)
  assert.equal(checkBiz.body.business.logo.url, logo1.url)

  // Upload Logo 2 and replace on business -> Logo 1 is deleted from Cloudinary
  const up2 = await agent
    .post('/api/uploads/logo')
    .set('X-CSRF-Token', csrf)
    .attach('logo', VALID_JPEG, { filename: 'l2.jpg', contentType: 'image/jpeg' })
  const logo2 = up2.body.logo

  const replaceRes = await agent
    .put(`/api/businesses/${bizId}`)
    .set('X-CSRF-Token', csrf)
    .send({ logo: logo2 })
  assert.equal(replaceRes.status, 200)
  assert.equal(replaceRes.body.business.logo.url, logo2.url)
  assert(deletedPublicIds.includes(logo1.publicId), 'Old logo must be deleted after replacement')

  // Remove logo -> Logo 2 is deleted from Cloudinary and business works without logo
  const removeRes = await agent
    .put(`/api/businesses/${bizId}`)
    .set('X-CSRF-Token', csrf)
    .send({ logo: null })
  assert.equal(removeRes.status, 200)
  assert.equal(removeRes.body.business.logo.url, '')
  assert(deletedPublicIds.includes(logo2.publicId), 'Removed logo must be deleted from Cloudinary')

  const pubAfterRemove = await request(app).get(`/api/public/businesses/${bizId}`)
  assert.equal(pubAfterRemove.status, 200)
  assert.equal(pubAfterRemove.body.business.logo, null)
})
