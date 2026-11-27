# ReviewBuddy — Deployment, Environment & Backup Guide

## 1. Local Development Ports & Setup

- **Frontend (`client/`):** Vite dev server on `http://localhost:5173` (proxies `/api/*` to `http://localhost:3001`).
- **Backend (`server/`):** Express API on `http://localhost:3001`.
- Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`, then fill in your own secrets locally. Never commit `.env` files.

---

## 2. Environment Variables

### Backend (`server/.env`)

| Variable | Required in Prod | Description |
|---|---|---|
| `NODE_ENV` | Yes (`production`) | Enables `Secure` cookies, HSTS, strict CSP, and `trust proxy`. |
| `PORT` | No (default `3001`) | HTTP listen port (Render sets this automatically). |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `SESSION_SECRET` | Yes (32+ chars) | Random cryptographic secret for `express-session`. |
| `FRONTEND_URL` | Yes | Exact `https://...` URL used to generate permanent QR links (`<FRONTEND_URL>/review/<publicId>`). |
| `CORS_ORIGINS` | Yes | Comma-separated exact `https://...` origins (never `*`). |
| `COOKIE_SAME_SITE` | No (`lax` default) | Use `lax` for same-origin/proxy deployments; use `none` **only** with `https://` for split-origin deployments (e.g., Vercel + Render). |
| `COOKIE_SECURE` | No (auto in prod) | Automatically `true` in production and whenever `COOKIE_SAME_SITE=none`. |
| `COOKIE_DOMAIN` | No | Optional cookie domain scope. |
| `TRUST_PROXY` | No (`1` in prod) | Reverse-proxy hop count (`0–5`). |
| `MONGO_MAX_POOL_SIZE` | No (`10` default) | Mongoose pool size (`2–25`, keep `<=10` on M0/512 MB tiers). |
| `SESSION_IDLE_TIMEOUT_MS` | No (`1800000`) | 30-minute idle session timeout. |
| `SESSION_MAX_LIFETIME_MS` | No (`43200000`) | 12-hour absolute session lifetime. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key (backend-only). |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (backend-only, never exposed to client). |

### Frontend (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_PUBLIC_APP_URL` | Public frontend base URL (e.g. `http://localhost:5173` in dev, `https://reviews.yourdomain.com` in prod). |
| `VITE_API_URL` | Optional API base URL if not using a `/api` rewrite (e.g. `https://api.yourdomain.com/api`). |

---

## 3. Production Deployment (Vercel + Render Free + MongoDB Atlas + Cloudinary)

1. **Database (MongoDB Atlas):**
   - Create a cluster (M0 Free or higher), enable network access for your backend, and create a least-privilege database user.
   - Ensure indexes are synced on deploy (`Business` and `AnalyticsEvent` models define indexes; `AnalyticsEvent.createdAt` has a 365-day TTL index `expireAfterSeconds: 31536000`).
2. **Backend (Render Web Service):**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command (512 MB container): `node --max-old-space-size=384 src/server.js` (or `npm start`)
   - Health Check Path: `/api/health` (returns `{ "status": "ok" }` with zero DB overhead).
   - Set all required production environment variables above.
   - *(Free-tier keep-awake option)* Configure **cron-job.org** to `GET https://<your-render-service>.onrender.com/api/health` every 10 minutes during business hours with a 30-second timeout and failure email notifications enabled.
3. **Frontend (Vercel or Cloudflare Pages):**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - **Recommended cookie-safe routing:** See Section 7 below (prefer same-origin `/api/*` rewrite or same-site custom domain over third-party cookies).
4. **QR Public URL Domain Migration:**
   - Each business has one immutable `publicId`. At creation time `qrPublicUrl` is saved using `FRONTEND_URL`. When `FRONTEND_URL` is changed to a production `https://` URL, both the frontend (`VITE_PUBLIC_APP_URL` / `window.location.origin`) and `GET /api/businesses/:id/qr` automatically upgrade any legacy `localhost` URL to the configured production domain. If moving from one production domain to another, update `FRONTEND_URL`, `VITE_PUBLIC_APP_URL`, and optionally update stored `qrPublicUrl` in MongoDB before re-printing QR cards.

---

## 4. Security Architecture Summary

- **Authentication:** Single-admin Argon2id password hashing, `express-session` backed by `connect-mongo`, `HttpOnly` + `Secure` (prod) cookies, session regeneration on login/password change, and `sessionVersion` invalidation.
- **CSRF & Origin:** Synchronizer CSRF tokens (`GET /api/auth/csrf` → `X-CSRF-Token` header) + `Origin` allowlist on all non-safe authenticated routes.
- **Headers:** Helmet CSP (`object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and production HSTS.

---

## 5. Deployment Checklist

- [ ] `NODE_ENV=production` and unique 32+ char `SESSION_SECRET` configured.
- [ ] `FRONTEND_URL` and `CORS_ORIGINS` set to exact `https://` production URLs.
- [ ] Strong production admin password set (`npm run create-admin` or Settings → Change Password).
- [ ] `GET /api/health` returns `200 { "status": "ok" }`.
- [ ] Admin login, business CRUD, logo upload, QR preview, and `/review/:publicId` flow verified over HTTPS.

---

## 6. MongoDB Backup, Restore & Recovery

### Backup (`mongodump`)
```bash
mongodump --uri="$MONGODB_URI" --archive="reviewbuddy-backup-$(date +%F).gz" --gzip
```

### Restore (`mongorestore`)
```bash
mongorestore --uri="$MONGODB_URI" --archive="reviewbuddy-backup-YYYY-MM-DD.gz" --gzip --nsInclude="reviewbuddy.*"
```

### Recovery if a Deployment Fails
1. Roll back to the previous healthy Render deployment / Vercel deployment from the host dashboard.
2. Verify `/api/health` returns `200`.
3. If a bad database change occurred, restore from the latest Atlas Continuous Backup snapshot or `mongodump` archive.
4. Verify restored database: check `db.admins.countDocuments() >= 1`, `db.businesses.countDocuments()`, `db.analyticsevents.countDocuments()`, confirm indexes (`email_1`, `publicId_1`, `createdAt_1` TTL), log in as admin, and test `/review/:publicId`.
5. Run `npm --prefix server test` and `npm --prefix client test` locally before re-deploying.

---

## 7. Browser Cookie Implications (Same-Site Custom Domain vs Split-Origin Vercel + Render)

- **Split-Origin (`*.vercel.app` + `*.onrender.com`) Limitation:** When frontend and backend live on different registrable domains, session cookies (`rb.sid`) are **third-party cookies**. Even with `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`, Safari ITP, Firefox ETP, and strict Chrome privacy settings can block third-party cookies, breaking admin authentication.
- **Recommended Safest Arrangement:**
  1. **Vercel `/api/*` rewrite (same-origin)** or **Same-Site Custom Domain** (`app.yourdomain.com` for Vercel + `api.yourdomain.com` for Render).
  2. With same-origin or same-site subdomains, set `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`, `TRUST_PROXY=1`, and (for subdomains) `COOKIE_DOMAIN=.yourdomain.com`. This keeps `HttpOnly` session cookies first-party across all modern browsers.x`

---

## 8. 512 MB Linux Container Verification & Safe Index Cleanup

### Measuring Memory in a 512 MB Linux/Render Container
Local Windows RSS benchmarks cannot guarantee identical Linux/Render container RSS because `glibc` memory allocation and cgroup accounting differ from Windows. After deploying to Render:
1. Run with `node --max-old-space-size=384 src/server.js` and `MONGO_MAX_POOL_SIZE=10`.
2. Inspect container memory in Render Metrics (or `cat /sys/fs/cgroup/memory.current` / `ps -o rss= -p <pid>`) at idle and during 20–30 concurrent submissions/analytics requests.
3. Confirm steady-state RSS remains <= 350 MB.

### Safe Index Migration (Optional Cleanup of Legacy Redundant Indexes)
Before dropping any index on Atlas, inspect `db.<col>.getIndexes()` and run during low traffic (never drop `_id_`, `email_1`, `publicId_1`, or `createdAt_1` TTL):
```js
db.analyticsevents.dropIndex("businessPublicId_1");
db.analyticsevents.dropIndex("eventType_1");
db.analyticsevents.dropIndex("createdAt_-1");
db.analyticsevents.dropIndex("eventType_1_createdAt_-1");
db.analyticsevents.dropIndex("businessPublicId_1_eventType_1_createdAt_-1");
db.businesses.dropIndex("name_1");
```
