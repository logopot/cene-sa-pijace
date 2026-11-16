import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { handleFeedback, resetFeedbackState } from '../functions/lib/feedback.js'

// Diagnostics of the 5xx answers: which phase failed and the upstream status,
// never any text from a service, token, key, name or message. All mocks.
const b64 = (buffer) => Buffer.from(buffer).toString('base64')
const keyPair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)
const pem = (der) => `-----BEGIN PRIVATE KEY-----\n${b64(der).match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`
const FAKE_ACCOUNT = {
  client_email: 'forms@example-project.iam.gserviceaccount.com',
  private_key: pem(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)),
  token_uri: 'https://oauth2.example.test/token',
}
const ENV = {
  FEEDBACK_SERVICE_ACCOUNT_JSON: JSON.stringify(FAKE_ACCOUNT),
  FEEDBACK_SPREADSHEET_ID: 'sheet-id-123',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
}
const NOW = Date.parse('2026-11-16T10:20:30.000Z')
const LEAK = 'text-that-must-never-appear'

// Healthy services unless `broken` replaces one of them.
function services(broken = {}) {
  const calls = { append: 0, token: 0 }
  const fetchImpl = async (url) => {
    url = String(url)
    const override = Object.entries(broken).find(([prefix]) => url.startsWith(prefix))
    if (override) {
      const value = override[1]
      if (value instanceof Error) throw value
      return value
    }
    if (url.includes('siteverify')) return Response.json({ success: true })
    if (url === FAKE_ACCOUNT.token_uri) {
      calls.token += 1
      return Response.json({ access_token: 'token-1', expires_in: 3600 })
    }
    calls.append += 1
    return new Response('{}', { status: 200 })
  }
  return { fetchImpl, calls }
}

const valid = (over = {}) => ({
  name: 'Tajno Ime',
  message: 'tajna poruka sadrzaj',
  page: '/grad/beograd',
  lang: 'sr',
  website: '',
  token: 'XXXX.DUMMY.TOKEN.XXXX',
  ...over,
})
// A different client address per request, so the flood brake never interferes.
let clients = 0
const post = (body = valid()) =>
  new Request('https://cenesapijace.org/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://cenesapijace.org', 'CF-Connecting-IP': `203.0.113.${(clients += 1) % 250}` },
    body: JSON.stringify(body),
  })

// One request with console.error captured: { status, body, logged }.
async function attempt(env = ENV, svc = services(), body = valid()) {
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args.join(' '))
  try {
    const response = await handleFeedback(post(body), env, { fetchImpl: svc.fetchImpl, now: NOW })
    return { status: response.status, body: await response.json(), logged, svc }
  } finally {
    console.error = original
  }
}
const server = (phase, upstream, extra = {}) => ({ ok: false, error: 'server_error', phase, upstream, ...extra })
const withKey = (private_key) => ({ ...ENV, FEEDBACK_SERVICE_ACCOUNT_JSON: JSON.stringify({ ...FAKE_ACCOUNT, private_key }) })

beforeEach(() => resetFeedbackState())

test('config: only the variable NAME is reported, never a value', async () => {
  for (const name of ['TURNSTILE_SECRET_KEY', 'FEEDBACK_SERVICE_ACCOUNT_JSON', 'FEEDBACK_SPREADSHEET_ID']) {
    const r = await attempt({ ...ENV, [name]: undefined })
    assert.equal(r.status, 500)
    assert.deepEqual(r.body, server('config', null, { var: name }))
    assert.deepEqual(r.logged, [`feedback: phase=config upstream=null var=${name}`])
  }
  for (const broken of [LEAK, '{"client_email":"a@b.c"}', '{}', '[]']) {
    const r = await attempt({ ...ENV, FEEDBACK_SERVICE_ACCOUNT_JSON: broken })
    assert.deepEqual(r.body, server('config', null, { var: 'FEEDBACK_SERVICE_ACCOUNT_JSON' }))
    assert.equal(JSON.stringify(r).includes(LEAK), false)
  }
})

test('turnstile_fetch: upstream status, or null when the request itself fails', async () => {
  let r = await attempt(ENV, services({ 'https://challenges.cloudflare.com': new Response(LEAK, { status: 503 }) }))
  assert.deepEqual(r.body, server('turnstile_fetch', 503))
  r = await attempt(ENV, services({ 'https://challenges.cloudflare.com': new TypeError(LEAK) }))
  assert.deepEqual(r.body, server('turnstile_fetch', null))
  assert.equal(JSON.stringify(r).includes(LEAK), false)
})

test('auth_parse_key, auth_import_key', async () => {
  let r = await attempt(withKey('-----BEGIN PRIVATE KEY-----\n!!!not base64!!!\n-----END PRIVATE KEY-----\n'))
  assert.deepEqual(r.body, server('auth_parse_key', null))
  r = await attempt(withKey('-----BEGIN PRIVATE KEY-----\nQUJDRA==\n-----END PRIVATE KEY-----\n'))
  assert.deepEqual(r.body, server('auth_import_key', null))
  assert.deepEqual(r.logged, ['feedback: phase=auth_import_key upstream=null'])
  // A valid key of the wrong kind (a public key) cannot be imported for signing.
  r = await attempt(withKey(pem(await crypto.subtle.exportKey('spki', keyPair.publicKey))))
  assert.deepEqual(r.body, server('auth_import_key', null))
})

test('auth_sign: a signing failure of WebCrypto is its own phase', async () => {
  const realSign = crypto.subtle.sign
  crypto.subtle.sign = async () => {
    throw new Error(LEAK)
  }
  try {
    const r = await attempt()
    assert.deepEqual(r.body, server('auth_sign', null))
    assert.equal(JSON.stringify(r).includes(LEAK), false)
  } finally {
    crypto.subtle.sign = realSign
  }
})

test('auth_token: token endpoint status, or null on network failure', async () => {
  let r = await attempt(ENV, services({ [FAKE_ACCOUNT.token_uri]: new Response(`{"error_description":"${LEAK}"}`, { status: 400 }) }))
  assert.deepEqual(r.body, server('auth_token', 400))
  assert.equal(JSON.stringify(r).includes(LEAK), false)
  resetFeedbackState()
  r = await attempt(ENV, services({ [FAKE_ACCOUNT.token_uri]: Response.json({}) }))
  assert.deepEqual(r.body, server('auth_token', 200))
  resetFeedbackState()
  r = await attempt(ENV, services({ [FAKE_ACCOUNT.token_uri]: new Error('dns') }))
  assert.deepEqual(r.body, server('auth_token', null))
})

test('sheets_append: status or null; answer and log never carry user text, tokens or keys', async () => {
  let r = await attempt(ENV, services({ 'https://sheets.googleapis.com': new Response(LEAK, { status: 403 }) }))
  assert.deepEqual(r.body, server('sheets_append', 403))
  resetFeedbackState()
  r = await attempt(ENV, services({ 'https://sheets.googleapis.com': new Error(LEAK) }))
  assert.deepEqual(r.body, server('sheets_append', null))
  const everything = JSON.stringify(r)
  for (const secret of [LEAK, 'Tajno', 'tajna', 'token-1', 'PRIVATE KEY', FAKE_ACCOUNT.client_email]) {
    assert.equal(everything.includes(secret), false, secret)
  }
})

test('the key arrives in any shape a dashboard can produce', async () => {
  const pretty = JSON.stringify(FAKE_ACCOUNT, null, 2)
  const shapes = {
    pretty,
    rawNewlines: pretty.replaceAll('\\n', '\n'),
    doubleEncoded: JSON.stringify(JSON.stringify(FAKE_ACCOUNT)),
    base64: btoa(JSON.stringify(FAKE_ACCOUNT)),
    asObject: FAKE_ACCOUNT,
    literalBackslashN: JSON.stringify({ ...FAKE_ACCOUNT, private_key: FAKE_ACCOUNT.private_key.replaceAll('\n', '\\n') }),
  }
  for (const [label, value] of Object.entries(shapes)) {
    resetFeedbackState()
    const r = await attempt({ ...ENV, FEEDBACK_SERVICE_ACCOUNT_JSON: value })
    assert.equal(r.status, 200, label)
    assert.equal(r.svc.calls.append, 1, label)
  }
})

test('development overrides point the calls at local mocks', async () => {
  const seen = []
  const fetchImpl = async (url) => {
    seen.push(String(url))
    if (String(url).includes('verify')) return Response.json({ success: true })
    if (String(url) === FAKE_ACCOUNT.token_uri) return Response.json({ access_token: 't', expires_in: 3600 })
    return new Response('{}')
  }
  const env = { ...ENV, FEEDBACK_SHEETS_API_BASE: 'http://127.0.0.1:9999', FEEDBACK_TURNSTILE_VERIFY_URL: 'http://127.0.0.1:9999/verify' }
  const response = await handleFeedback(post(), env, { fetchImpl, now: NOW })
  assert.equal(response.status, 200)
  assert.equal(seen[0], 'http://127.0.0.1:9999/verify')
  assert.equal(seen.at(-1).startsWith('http://127.0.0.1:9999/v4/spreadsheets/'), true)
})
