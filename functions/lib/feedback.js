// Logic of POST /api/feedback (the route file is functions/api/feedback.js).
// Runs in the Cloudflare Workers runtime WITHOUT nodejs_compat, so it uses only
// Web-standard APIs: fetch, WebCrypto (crypto.subtle), TextEncoder, URL, btoa/atob
// on binary (Latin-1) strings. No Buffer, no process, no require, no node:*
// imports - tests/workers-sim.test.mjs runs it with those globals removed and
// checks the source for them. Every dependency (fetch, clock) can be injected,
// so the tests run it against mocks and never touch Google or Cloudflare.
//
// Environment (Pages -> Settings -> Variables and Secrets, read at request time
// from context.env - see README "Feedback forma"):
//   FEEDBACK_SERVICE_ACCOUNT_JSON  secret  service account key (JSON)
//   FEEDBACK_SPREADSHEET_ID                 the price spreadsheet's id
//   FEEDBACK_SHEET_NAME            optional tab name, default "Feedback"
//   TURNSTILE_SECRET_KEY           secret  Turnstile secret
//   ALLOW_PREVIEW_ORIGINS          optional "true": also accept https://*.pages.dev
// Development only (point the endpoint at local mocks, e.g. under `wrangler pages
// dev`); leave unset in production:
//   FEEDBACK_SHEETS_API_BASE, FEEDBACK_TURNSTILE_VERIFY_URL
//
// A 5xx answer names the step that failed - {"ok":false,"error":"server_error",
// "phase":"sheets_append","upstream":403} - see README "Feedback forma". `phase`
// is one of config, turnstile_fetch, auth_parse_key, auth_import_key, auth_sign,
// auth_token, sheets_append; `upstream` is only the HTTP status of the Google or
// Cloudflare service (or null); config errors add `var`, the NAME of the
// variable. Never any error text, token, key, name or message - not in the
// answer and not in the log.
import { validateFeedback, protectFromFormula } from '../../src/utils/feedbackRules.js'

export const MAX_BODY_BYTES = 4096
export const SITE_ORIGIN = 'https://cenesapijace.org'
export const DEFAULT_SHEET_NAME = 'Feedback'
export const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const SHEETS_API_BASE = 'https://sheets.googleapis.com'
const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token'
const TOKEN_CACHE_MS = 50 * 60 * 1000

// Best-effort flood brake, per Worker instance and only in memory (nothing is
// stored or logged): at most RATE_LIMIT accepted-for-processing posts per key in
// RATE_WINDOW_MS. Turnstile is the real abuse protection.
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const recentPosts = new Map()
const tokenCache = { value: null }

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

// ------------------------------------------------------------ phased errors

// A failure at a known step. Carries only what the 5xx answer may show: the
// phase, the upstream HTTP status (or null) and, for config, a variable NAME.
class PhaseError extends Error {
  constructor(phase, upstream = null, varName = '') {
    super(phase)
    this.phase = phase
    this.upstream = upstream
    this.varName = varName
  }
}

function serverError(error, fallbackPhase) {
  const phase = error instanceof PhaseError ? error.phase : fallbackPhase
  const upstream = error instanceof PhaseError ? error.upstream : null
  const varName = error instanceof PhaseError ? error.varName : ''
  // The log carries exactly what the answer does - nothing else.
  console.error(`feedback: phase=${phase} upstream=${upstream}${varName ? ` var=${varName}` : ''}`)
  return json(500, { ok: false, error: 'server_error', phase, upstream, ...(varName && { var: varName }) })
}

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

// ------------------------------------------------------------------- config

const REQUIRED_VARIABLES = ['TURNSTILE_SECRET_KEY', 'FEEDBACK_SERVICE_ACCOUNT_JSON', 'FEEDBACK_SPREADSHEET_ID']

const isText = (value) => typeof value === 'string' && value.trim() !== ''

// The service account key as it may really arrive from the dashboard: JSON text
// (the usual case), JSON with raw line breaks inside private_key, JSON wrapped
// in one more layer of quotes, the whole file base64-encoded, or a variable of
// type "JSON" (already an object). Anything else is a config error naming only
// the variable.
export function readServiceAccount(raw) {
  const NAME = 'FEEDBACK_SERVICE_ACCOUNT_JSON'
  let account = null
  if (raw && typeof raw === 'object') {
    account = raw
  } else if (isText(raw)) {
    let text = raw.trim()
    if (text[0] !== '{' && text[0] !== '"') {
      try {
        text = atob(text.replace(/\s+/g, ''))
      } catch {
        // not base64 - fall through to the JSON attempts on the original text
      }
    }
    try {
      account = JSON.parse(text)
      if (typeof account === 'string') account = JSON.parse(account)
    } catch {
      // A key pasted with real line breaks inside the string is not valid JSON;
      // pull the two fields out directly.
      const email = text.match(/"client_email"\s*:\s*"([^"]+)"/)?.[1]
      const key = text.match(/"private_key"\s*:\s*"([\s\S]*?)"\s*[,}]/)?.[1]
      const tokenUri = text.match(/"token_uri"\s*:\s*"([^"]+)"/)?.[1]
      account = email && key ? { client_email: email, private_key: key, token_uri: tokenUri } : null
    }
  }
  if (!account || typeof account !== 'object' || !isText(account.client_email) || !isText(account.private_key)) {
    throw new PhaseError('config', null, NAME)
  }
  return { ...account, private_key: account.private_key.replace(/\\n/g, '\n') }
}

function readConfig(env) {
  for (const name of REQUIRED_VARIABLES) {
    const value = env[name]
    if (!(isText(value) || (name === 'FEEDBACK_SERVICE_ACCOUNT_JSON' && value && typeof value === 'object'))) {
      throw new PhaseError('config', null, name)
    }
  }
  return { account: readServiceAccount(env.FEEDBACK_SERVICE_ACCOUNT_JSON) }
}

// ---------------------------------------------------------------- Turnstile

async function verifyTurnstile(token, ip, env, fetchImpl) {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token })
  if (ip) form.set('remoteip', ip)
  let response
  try {
    response = await fetchImpl(env.FEEDBACK_TURNSTILE_VERIFY_URL || TURNSTILE_VERIFY_URL, { method: 'POST', body: form })
  } catch {
    throw new PhaseError('turnstile_fetch', null)
  }
  if (!response.ok) throw new PhaseError('turnstile_fetch', response.status)
  let result
  try {
    result = await response.json()
  } catch {
    throw new PhaseError('turnstile_fetch', response.status)
  }
  return result?.success === true
}

// ----------------------------------------------------- Google service account

const base64url = (bytes) => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}
const encodeSegment = (value) => base64url(new TextEncoder().encode(JSON.stringify(value)))

// PEM text -> the key's DER bytes (PKCS#8, what Google service account keys use).
function pemToPkcs8(pem) {
  const body = pem
    .replace(/-----BEGIN[^-]*-----|-----END[^-]*-----/g, '')
    .replace(/\s+/g, '')
  let binary
  try {
    binary = atob(body)
  } catch {
    throw new PhaseError('auth_parse_key')
  }
  if (binary.length === 0) throw new PhaseError('auth_parse_key')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// The signed JWT of the "service account -> access token" exchange (RS256).
export async function signServiceAccountJwt(account, nowSeconds) {
  const der = pemToPkcs8(account.private_key)
  let key
  try {
    key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  } catch {
    throw new PhaseError('auth_import_key')
  }
  const unsigned = `${encodeSegment({ alg: 'RS256', typ: 'JWT' })}.${encodeSegment({
    iss: account.client_email,
    scope: SHEETS_SCOPE,
    aud: account.token_uri || DEFAULT_TOKEN_URI,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  })}`
  try {
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
    return `${unsigned}.${base64url(new Uint8Array(signature))}`
  } catch {
    throw new PhaseError('auth_sign')
  }
}

// Access token, kept in memory for ~50 minutes (Google's last 60).
async function getAccessToken(account, fetchImpl, now, { forceRefresh = false } = {}) {
  if (!forceRefresh && tokenCache.value && tokenCache.value.expiresAt > now) return tokenCache.value.token

  const assertion = await signServiceAccountJwt(account, Math.floor(now / 1000))
  let response
  try {
    response = await fetchImpl(account.token_uri || DEFAULT_TOKEN_URI, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    })
  } catch {
    throw new PhaseError('auth_token', null)
  }
  if (!response.ok) throw new PhaseError('auth_token', response.status)
  let parsed
  try {
    parsed = await response.json()
  } catch {
    throw new PhaseError('auth_token', response.status)
  }
  if (!parsed?.access_token) throw new PhaseError('auth_token', response.status)
  tokenCache.value = {
    token: parsed.access_token,
    expiresAt: now + Math.min(TOKEN_CACHE_MS, (parsed.expires_in ?? 3600) * 1000 - 60_000),
  }
  return parsed.access_token
}

// Row layout: Datum | Ime | Poruka | Strana | Jezik | Status. The date is the
// server's; no IP address and no User-Agent are ever part of it.
export function buildSheetRow(fields, nowIso) {
  return [nowIso, fields.name, fields.message, fields.page, fields.lang, 'novo']
}

export function buildAppendRequest(env, row) {
  const sheet = (env.FEEDBACK_SHEET_NAME || DEFAULT_SHEET_NAME).replaceAll("'", "''")
  const range = encodeURIComponent(`'${sheet}'!A:F`)
  const base = env.FEEDBACK_SHEETS_API_BASE || SHEETS_API_BASE
  return {
    url: `${base}/v4/spreadsheets/${encodeURIComponent(env.FEEDBACK_SPREADSHEET_ID)}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    body: JSON.stringify({ values: [row] }),
  }
}

async function appendRow(env, account, row, fetchImpl, now) {
  const { url, body } = buildAppendRequest(env, row)
  for (const forceRefresh of [false, true]) {
    const token = await getAccessToken(account, fetchImpl, now, { forceRefresh })
    let response
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body,
      })
    } catch {
      throw new PhaseError('sheets_append', null)
    }
    if (response.ok) return
    // A rejected cached token: fetch a fresh one once, then give up.
    if (response.status === 401 && !forceRefresh) continue
    throw new PhaseError('sheets_append', response.status)
  }
}

// ------------------------------------------------------------------ handler

// `fetch` is called through a wrapper, never stored bare, so it keeps its
// global receiver in every runtime.
const defaultFetch = (...args) => fetch(...args)

export async function handleFeedback(request, env, { fetchImpl = defaultFetch, now = Date.now() } = {}) {
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

  // From here on a failure is ours or an upstream's: it is answered with the
  // phase it happened in (and the phase is all the log says about it).
  let phase = 'config'
  try {
    const { account } = readConfig(env)

    const token = typeof body.token === 'string' ? body.token : ''
    if (!token || token.length > 2048) return failure(400, 'verification_failed')
    phase = 'turnstile_fetch'
    if (!(await verifyTurnstile(token, ip, env, fetchImpl))) return failure(400, 'verification_failed')

    const { name, message, page, lang } = checked.value
    const row = buildSheetRow(
      { name: protectFromFormula(name), message: protectFromFormula(message), page, lang },
      new Date(now).toISOString(),
    )
    phase = 'sheets_append'
    await appendRow(env, account, row, fetchImpl, now)
  } catch (error) {
    return serverError(error, phase)
  }
  return json(200, { ok: true })
}
