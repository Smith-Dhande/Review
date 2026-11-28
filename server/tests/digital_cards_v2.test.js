import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-v2-test-'))
process.env.NODE_ENV = 'test'
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters-12345'
process.env.FRONTEND_URL = 'https://review-one-teal.vercel.app'
process.env.CORS_ORIGINS = 'https://review-one-teal.vercel.app'
process.env.LOCAL_ADMIN_FILE = path.join(tmpDir, 'admin.json')
process.env.LOCAL_SESSION_FILE = path.join(tmpDir, 'sessions.json')
process.env.LOCAL_EVENTS_FILE = path.join(tmpDir, 'analyticsEvents.json')
process.env.LOCAL_BUSINESSES_FILE = path.join(tmpDir, 'businesses.json')
process.env.LOCAL_DIGITAL_CARDS_FILE = path.join(tmpDir, 'digitalCards.json')
process.env.LOCAL_DIGITAL_CARD_EVENTS_FILE = path.join(tmpDir, 'digitalCardEvents.json')
process.env.LOGIN_RATE_LIMIT_MAX = '100'

const { createApp } = await import('../src/app.js')
const { createAdminRecord } = await import('../src/repositories/adminRepo.js')
const { hashPassword } = await import('../src/utils/password.js')

const ADMIN_EMAIL = 'v2-admin@reviewbuddy.test'
const ADMIN_PASS = 'V2Cards#StrongPass1!'

await createAdminRecord({
  email: ADMIN_EMAIL,
  name: 'V2 Admin',
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

test('Digital Cards admin API requires auth and supports full CRUD, duplicate, status, and unique slugs', async () => {
  const unauth = await request(app).get('/api/digital-cards')
  assert.equal(unauth.status, 401)

  const { agent, csrfToken } = await loginAsAdmin()

  // Reject unsafe javascript: URL
  const badUrl = await agent
    .post('/api/digital-cards')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Bad URL Card',
      contactInformation: { website: 'javascript:alert(1)' },
    })
  assert.equal(badUrl.status, 400)

  // Create two cards with same name -> unique permanent slugs
  const c1 = await agent
    .post('/api/digital-cards')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'John Smith',
      templateId: 'premium-dark',
      personalInformation: {
        fullName: 'John Smith',
        jobTitle: 'Founder',
        companyName: 'Acme Studio',
        shortBio: 'Design & engineering consultant.',
      },
      contactInformation: {
        phone: '+91 98201 00001',
        email: 'john@acme.example',
        website: 'https://acme.example',
      },
      socialLinks: {
        displayStyle: 'icon_label',
        items: [
          {
            id: 's1',
            platform: 'linkedin',
            label: 'LinkedIn',
            url: 'https://linkedin.com/in/johnsmith',
            enabled: true,
          },
        ],
      },
      visibilitySettings: {
        showEmail: false,
      },
    })
  assert.equal(c1.status, 201)
  const slug1 = c1.body.card.slug
  assert.ok(slug1.startsWith('john-smith-'))
  assert.equal(
    c1.body.card.publicUrl,
    `https://review-one-teal.vercel.app/card/${slug1}`,
  )

  const c2 = await agent
    .post('/api/digital-cards')
    .set('X-CSRF-Token', csrfToken)
    .send({ name: 'John Smith' })
  assert.equal(c2.status, 201)
  assert.notEqual(c2.body.card.slug, slug1)

  // Update appearance & personal info -> slug remains permanent
  const upd = await agent
    .put(`/api/digital-cards/${slug1}`)
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Johnathan Smith',
      appearance: { headingFont: 'Playfair Display', primaryColor: '#1E3A8A' },
    })
  assert.equal(upd.status, 200)
  assert.equal(upd.body.card.slug, slug1)
  assert.equal(upd.body.card.appearance.headingFont, 'Playfair Display')

  // Duplicate card -> created paused with unique slug
  const dup = await agent
    .post(`/api/digital-cards/${slug1}/duplicate`)
    .set('X-CSRF-Token', csrfToken)
  assert.equal(dup.status, 201)
  assert.equal(dup.body.card.status, 'paused')
  assert.notEqual(dup.body.card.slug, slug1)

  // Pagination & search
  const listRes = await agent.get('/api/digital-cards?page=1&limit=2&search=John')
  assert.equal(listRes.status, 200)
  assert.equal(listRes.body.cards.length, 2)
  assert.ok(listRes.body.pagination.total >= 2)

  // QR endpoints
  const qrJson = await agent.get(`/api/digital-cards/${slug1}/qr?format=json`)
  assert.equal(qrJson.status, 200)
  assert.ok(qrJson.body.dataUrl.startsWith('data:image/png;base64,'))

  const qrSvg = await agent.get(`/api/digital-cards/${slug1}/qr?format=svg`)
  assert.equal(qrSvg.status, 200)
  const svgStr = Buffer.isBuffer(qrSvg.body)
    ? qrSvg.body.toString('utf-8')
    : String(qrSvg.text || '')
  assert.match(svgStr, /<svg/)
})

test('Public digital card profile, vCard generation, visibility filtering, paused/deleted states, and analytics', async () => {
  const { agent, csrfToken } = await loginAsAdmin()

  const created = await agent
    .post('/api/digital-cards')
    .set('X-CSRF-Token', csrfToken)
    .send({
      name: 'Dr. Aditi Rao',
      personalInformation: {
        fullName: 'Dr. Aditi Rao',
        jobTitle: 'Dentist',
        companyName: 'SmileCare',
      },
      contactInformation: {
        phone: '+91 98201 11223',
        email: 'hidden@smilecare.example',
        website: 'https://smilecare.example',
      },
      visibilitySettings: {
        showEmail: false,
      },
    })
  assert.equal(created.status, 201)
  const slug = created.body.card.slug

  // Public GET filters out hidden email
  const pubGet = await request(app).get(`/api/public/digital-cards/${slug}`)
  assert.equal(pubGet.status, 200)
  assert.equal(pubGet.body.card.personalInformation.fullName, 'Dr. Aditi Rao')
  assert.equal(pubGet.body.card.contactInformation.phone, '+91 98201 11223')
  assert.equal(pubGet.body.card.contactInformation.email, '')

  // Public vCard omits hidden email and includes visible phone
  const vcfRes = await request(app).get(`/api/public/digital-cards/${slug}/vcard`)
  assert.equal(vcfRes.status, 200)
  assert.match(vcfRes.text, /BEGIN:VCARD/)
  assert.match(vcfRes.text, /FN:Dr\. Aditi Rao/)
  assert.match(vcfRes.text, /\+91 98201 11223/)
  assert.doesNotMatch(vcfRes.text, /hidden@smilecare\.example/)
  assert.match(vcfRes.text, /END:VCARD/)

  // Analytics tracking & validation
  const badEv = await request(app)
    .post(`/api/public/digital-cards/${slug}/events`)
    .send({ event: 'invalidEvent' })
  assert.equal(badEv.status, 400)

  const okVisit = await request(app)
    .post(`/api/public/digital-cards/${slug}/events`)
    .send({ event: 'profileVisits' })
  assert.equal(okVisit.status, 200)

  const okSave = await request(app)
    .post(`/api/public/digital-cards/${slug}/events`)
    .send({ event: 'saveContactClicks' })
  assert.equal(okSave.status, 200)

  const cardAn = await agent.get(`/api/digital-cards/${slug}/analytics?range=7d`)
  assert.equal(cardAn.status, 200)
  assert.equal(cardAn.body.stats.profileVisits, 1)
  assert.equal(cardAn.body.stats.saveContactClicks, 1)

  const ovAn = await agent.get('/api/digital-cards/analytics/overview?range=7d')
  assert.equal(ovAn.status, 200)
  assert.ok(ovAn.body.stats.profileVisits >= 1)

  // Pause card -> public hides data & vCard returns 403
  const pauseRes = await agent
    .patch(`/api/digital-cards/${slug}/status`)
    .set('X-CSRF-Token', csrfToken)
    .send({ status: 'paused' })
  assert.equal(pauseRes.status, 200)

  const pausedPub = await request(app).get(`/api/public/digital-cards/${slug}`)
  assert.equal(pausedPub.status, 200)
  assert.equal(pausedPub.body.card.status, 'paused')
  assert.equal(pausedPub.body.card.contactInformation, undefined)

  const pausedVcf = await request(app).get(`/api/public/digital-cards/${slug}/vcard`)
  assert.equal(pausedVcf.status, 403)

  // Delete card -> public returns 404
  const delRes = await agent
    .delete(`/api/digital-cards/${slug}`)
    .set('X-CSRF-Token', csrfToken)
  assert.equal(delRes.status, 200)

  const afterDel = await request(app).get(`/api/public/digital-cards/${slug}`)
  assert.equal(afterDel.status, 404)

  // Rate limiting on /events
  const rateCard = await agent
    .post('/api/digital-cards')
    .set('X-CSRF-Token', csrfToken)
    .send({ name: 'Rate Limit Card' })
  const rSlug = rateCard.body.card.slug
  let hit429 = false
  for (let i = 0; i < 42; i += 1) {
    const r = await request(app)
      .post(`/api/public/digital-cards/${rSlug}/events`)
      .send({ event: 'profileVisits' })
    if (r.status === 429) {
      hit429 = true
      break
    }
  }
  assert.equal(hit429, true)
})
