import session from 'express-session'
import MongoStore from 'connect-mongo'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Persistent file-backed session store for local development & isolated tests
 * when MONGODB_URI is not configured. Production always uses connect-mongo.
 */
class JsonSessionStore extends session.Store {
  constructor(filePath) {
    super()
    this.filePath = filePath
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '{}', 'utf-8')
    }
  }

  _readAll() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'))
    } catch {
      return {}
    }
  }

  _writeAll(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  get(sid, callback) {
    try {
      const all = this._readAll()
      const sess = all[sid]
      if (!sess) return callback(null, null)
      if (sess.cookie?.expires && new Date(sess.cookie.expires) <= new Date()) {
        delete all[sid]
        this._writeAll(all)
        return callback(null, null)
      }
      return callback(null, sess)
    } catch (err) {
      return callback(err)
    }
  }

  set(sid, sess, callback) {
    try {
      const all = this._readAll()
      all[sid] = sess
      this._writeAll(all)
      return callback?.(null)
    } catch (err) {
      return callback?.(err)
    }
  }

  destroy(sid, callback) {
    try {
      const all = this._readAll()
      delete all[sid]
      this._writeAll(all)
      return callback?.(null)
    } catch (err) {
      return callback?.(err)
    }
  }

  touch(sid, sess, callback) {
    return this.set(sid, sess, callback)
  }
}

export const SESSION_COOKIE_NAME = 'rb.sid'

export function getCookieAttributes(env) {
  const sameSite = env?.cookieSameSite || 'lax'
  const secure =
    typeof env?.cookieSecure === 'boolean'
      ? env.cookieSecure
      : Boolean(env?.isProd || sameSite === 'none')
  return {
    path: '/',
    httpOnly: true,
    sameSite,
    secure,
    domain: env?.cookieDomain,
  }
}

export function clearSessionCookie(res, env) {
  res.clearCookie(SESSION_COOKIE_NAME, getCookieAttributes(env))
}

export function createSessionMiddleware(env) {
  const useMongoStore =
    env.mongoUri && (!env.isTest || process.env.ALLOW_TEST_MONGO === 'true' || process.env.TEST_MONGODB_URI)

  let store
  if (useMongoStore) {
    store = MongoStore.create({
      mongoUrl: process.env.TEST_MONGODB_URI || env.mongoUri,
      collectionName: 'sessions',
      ttl: Math.ceil(env.sessionMaxLifetimeMs / 1000),
      autoRemove: 'native',
      touchAfter: 60,
      mongoOptions: {
        maxPoolSize: 5,
        minPoolSize: 1,
      },
    })
  } else {
    if (env.isProd) {
      throw new Error('FATAL: Persistent MongoDB session store required in production.')
    }
    const localSessionFile =
      process.env.LOCAL_SESSION_FILE ||
      (env.isTest
        ? path.join(os.tmpdir(), 'reviewbuddy-test-sessions.json')
        : path.join(__dirname, '..', '..', 'data', 'sessions.json'))
    store = new JsonSessionStore(localSessionFile)
  }

  const baseCookie = getCookieAttributes(env)

  return session({
    name: SESSION_COOKIE_NAME,
    secret: env.sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extends idle timeout on activity; absolute lifetime enforced in requireAuth
    proxy: Boolean(env.trustProxy),
    cookie: {
      ...baseCookie,
      maxAge: env.sessionIdleTimeoutMs,
    },
  })
}
