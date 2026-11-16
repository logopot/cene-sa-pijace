// Logic of POST /api/feedback (the route file is functions/api/feedback.js).
// Runs in the Cloudflare Workers runtime: only Web-standard APIs (fetch,
// WebCrypto, URL) - no Node packages. Every dependency (fetch, clock) can be
// injected, so the tests run it against mocks and never touch Google or
// Cloudflare.
//
// Environment (Pages -> Settings -> Variables and Secrets, read at request time
// from context.env - see README "Feedback forma"):
//   FEEDBACK_SERVICE_ACCOUNT_JSON  secret  service account key (JSON)
//   FEEDBACK_SPREADSHEET_ID                 the price spreadsheet's id
//   FEEDBACK_SHEET_NAME            optional tab name, default "Feedback"
//   TURNSTILE_SECRET_KEY           secret  Turnstile secret
//   ALLOW_PREVIEW_ORIGINS          optional "true": also accept https://*.pages.dev
import { validateFeedback, protectFromFormula } from '../../src/utils/feedbackRules.js'

export const MAX_BODY_BYTES = 4096
export const SITE_ORIGIN = 'https://cenesapijace.org'
export const DEFAULT_SHEET_NAME = 'Feedback'
export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token'
const TOKEN_CACHE_MS = 50 * 60 * 1000

// Best-effort flood brake, per Worker instance and only in memory (nothing is
// stored or logged): at most RATE_LIMIT accepted-for-processing posts per key in
// RATE_WINDOW_MS. Turnstile is the real abuse protection.
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const recentPosts = new Map()

export function resetFeedbackState() {
  recentPosts.clear()
  tokenCache.value = null
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
  })
}

const failure = (status, error) => json(status, { ok: false, error })

// ------------------------------------------------------------------ request

export function isAllowedOrigin(origin, env) {
  if (!origin) return false
  if (origin === SITE_ORIGIN) return true
  if (env.ALLOW_PREVIEW_ORIGINS === 'true') {
    try {
      const url = new URL(origin)
      return url.protocol === 'https:' && url.hostname.endsWith('.pages.dev') && url.origin === origin
    } catch {
      return false
    }
  }
  return false
}

function requestOrigin(request) {
  const origin = request.headers.get('Origin')
  if (origin) return origin
  const referer = request.headers.get('Referer')
  if (!referer) return ''
  try {
    return new URL(referer).origin
  } catch {
    return ''
  }
}

function tooManyPosts(key, now) {
  const recent = (recentPosts.get(key) ?? []).filter((time) => now - time < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    recentPosts.set(key, recent)
    return true
  }
  recent.push(now)
  recentPosts.set(key, recent)
  return false
}

// ---------------------------------------------------------------- Turnstile

async function verifyTurnstile(token, ip, env, fetchImpl) {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
  if (ip) form.set('remoteip', ip)
  const response = await fetchImpl(TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
  if (!response.ok) return { ok: false, reason: `http_${response.status}` }
  const result = await response.json()
  return { ok: result?.success === true, reason: 'rejected' }
}

// ----------------------------------------------------- Google service account

const base64url = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
const encodeSegment = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)))

function pemToPkcs8(pem) {
  const body = pem.replace(/-----(BEGIN|END)[^-]*-----/g, '').replace(/\s+/g, '')
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// The signed JWT of the "service account -> access token" exchange (RS256).
export async function signServiceAccountJwt(account, nowSeconds) {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const unsigned = `${encodeSegment({ alg: 'RS256', typ: 'JWT' })}.${encodeSegment({
    iss: account.client_email,
    scope: SHEETS_SCOPE,
    aud: account.token_uri || DEFAULT_TOKEN_URI,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  })}`
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${base64url(new Uint8Array(signature))}`
}

// Access token, kept in memory for ~50 minutes (Google's last 60).
const tokenCache = { value: null }

async function getAccessToken(env, fetchImpl, now, { forceRefresh = false } = {}) {
  if (!forceRefresh && tokenCache.value && tokenCache.value.expiresAt > now) return tokenCache.value.token

  const account = JSON.parse(env.FEEDBACK_SERVICE_ACCOUNT_JSON)
  const assertion = await signServiceAccountJwt(account, Math.floor(now / 1000))
  const response = await fetchImpl(account.token_uri || DEFAULT_TOKEN_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!response.ok) throw new FeedbackError('token', response.status)
  const { access_token: token, expires_in: expiresIn } = await response.json()
  if (!token) throw new FeedbackError('token', 0)
  tokenCache.value = { token, expiresAt: now + Math.min(TOKEN_CACHE_MS, (expiresIn ?? 3600) * 1000 - 60_000) }
  return token
}

class FeedbackError extends Error {
  constructor(stage, status) {
    super(`${stage}:${status}`)
    this.stage = stage
    this.status = status
  }
}

// Row layout: Datum | Ime | Poruka | Strana | Jezik | Status. The date is the
// server's; no IP address and no User-Agent are ever part of it.
export function buildSheetRow(fields, nowIso) {
  return [nowIso, fields.name, fields.message, fields.path, fields.lang, 'novo']
}

export function buildAppendRequest(env, row) {
  const sheet = (env.FEEDBACK_SHEET_NAME || DEFAULT_SHEET_NAME).replaceAll("'", "''")
  const range = encodeURIComponent(`'${sheet}'!A:F`)
  return {
    url: `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.FEEDBACK_SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: JSON.stringify({ values: [row] }),
  }
}

async function appendRow(env, row, fetchImpl, now) {
  const { url, body } = buildAppendRequest(env, row)
  for (const forceRefresh of [false, true]) {
    const token = await getAccessToken(env, fetchImpl, now, { forceRefresh })
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body,
    })
    if (response.ok) return
    // A rejected cached token: fetch a fresh one once, then give up.
    if (response.status === 401 && !forceRefresh) continue
    throw new FeedbackError('append', response.status)
  }
}

// ------------------------------------------------------------------ handler

export async function handleFeedback(request, env, { fetchImpl = fetch, now = Date.now() } = {}) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' }, { allow: 'POST' })
  }
  if (!isAllowedOrigin(requestOrigin(request), env)) return failure(403, 'forbidden')
  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return failure(415, 'unsupported_media_type')
  }

  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_BODY_BYTES) return failure(413, 'too_large')
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return failure(413, 'too_large')

  let body
  try {
    body = JSON.parse(text)
  } catch {
    return failure(400, 'invalid')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return failure(400, 'invalid')

  // Honeypot: a person never sees the field. Pretend it worked, write nothing.
  if (typeof body.website === 'string' && body.website !== '') return json(200, { ok: true })

  const checked = validateFeedback(body)
  if (!checked.ok) return failure(400, 'invalid')

  const ip = request.headers.get('CF-Connecting-IP') || ''
  if (tooManyPosts(ip || 'unknown', now)) return failure(429, 'too_many_requests')

  if (!env.TURNSTILE_SECRET_KEY || !env.FEEDBACK_SERVICE_ACCOUNT_JSON || !env.FEEDBACK_SPREADSHEET_ID) {
    console.error('feedback: not configured')
    return failure(500, 'server_error')
  }

  const token = typeof body.token === 'string' ? body.token : ''
  if (!token || token.length > 2048) return failure(400, 'verification_failed')
  try {
    const verdict = await verifyTurnstile(token, ip, env, fetchImpl)
    if (!verdict.ok) {
      if (verdict.reason !== 'rejected') console.error('feedback: turnstile error', verdict.reason)
      return failure(verdict.reason === 'rejected' ? 400 : 500, verdict.reason === 'rejected' ? 'verification_failed' : 'server_error')
    }
  } catch {
    console.error('feedback: turnstile unreachable')
    return failure(500, 'server_error')
  }

  const { name, message, path, lang } = checked.value
  const row = buildSheetRow(
    { name: protectFromFormula(name), message: protectFromFormula(message), path, lang },
    new Date(now).toISOString(),
  )
  try {
    await appendRow(env, row, fetchImpl, now)
  } catch (error) {
    // Only where it failed and the HTTP status - never the content, never Google's body.
    console.error('feedback: write failed', error instanceof FeedbackError ? `${error.stage} ${error.status}` : 'unexpected')
    return failure(500, 'server_error')
  }
  return json(200, { ok: true })
}

