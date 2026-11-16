import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { handleFeedback, resetFeedbackState, MAX_BODY_BYTES } from '../functions/lib/feedback.js'
import { onRequest } from '../functions/api/feedback.js'

// Everything below runs against mocks: no Google, no Cloudflare, no real keys.
const b64 = (buffer) => Buffer.from(buffer).toString('base64')
const keyPair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)
const pkcs8 = b64(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))
const FAKE_ACCOUNT = {
  client_email: 'forms@example-project.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----\n${pkcs8.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`,
  token_uri: 'https://oauth2.example.test/token',
}
const ENV = {
  FEEDBACK_SERVICE_ACCOUNT_JSON: JSON.stringify(FAKE_ACCOUNT),
  FEEDBACK_SPREADSHEET_ID: 'sheet-id-123',
  // Cloudflare's published always-pass test secret.
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
}
const NOW = Date.parse('2026-11-16T10:20:30.000Z')

// Mock of the three services the endpoint talks to; records every call.
function makeMock({ turnstileSuccess = true, sheetsStatus = 200, firstSheetsStatus } = {}) {
  const calls = { turnstile: [], token: [], append: [] }
  let sheetsCalls = 0
  const fetchImpl = async (url, init) => {
    url = String(url)
    if (url.startsWith('https://challenges.cloudflare.com/turnstile/v0/siteverify')) {
      calls.turnstile.push(Object.fromEntries(new URLSearchParams(init.body)))
      return Response.json({ success: turnstileSuccess })
    }
    if (url === FAKE_ACCOUNT.token_uri) {
      calls.token.push(Object.fromEntries(new URLSearchParams(init.body)))
      return Response.json({ access_token: `token-${calls.token.length}`, expires_in: 3600 })
    }
    if (url.startsWith('https://sheets.googleapis.com/')) {
      sheetsCalls += 1
      calls.append.push({ url, headers: init.headers, body: JSON.parse(init.body) })
      const status = sheetsCalls === 1 && firstSheetsStatus ? firstSheetsStatus : sheetsStatus
      return new Response(JSON.stringify({ error: { message: 'secret detail from Google' } }), { status })
    }
    throw new Error(`unexpected fetch ${url}`)
  }
  return { fetchImpl, calls }
}

const post = (body, { headers = {}, method = 'POST', raw } = {}) =>
  new Request('https://cenesapijace.org/api/feedback', {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://cenesapijace.org', 'CF-Connecting-IP': '203.0.113.9', ...headers },
    body: method === 'GET' ? undefined : (raw ?? JSON.stringify(body)),
  })
const valid = (over = {}) => ({
  name: 'Ana',
  message: 'Predlog za sajt, hvala',
  path: '/grad/beograd',
  lang: 'sr',
  website: '',
  token: 'XXXX.DUMMY.TOKEN.XXXX',
  ...over,
})
const run = (request, env = ENV, mock = makeMock({})) =>
  handleFeedback(request, env, { fetchImpl: mock.fetchImpl, now: NOW }).then((response) => ({ response, mock }))

beforeEach(() => resetFeedbackState())

test('GET (and every non-POST method) is 405', async () => {
  const { response } = await run(post(null, { method: 'GET' }))
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('allow'), 'POST')
  const put = new Request('https://cenesapijace.org/api/feedback', { method: 'PUT', body: '{}' })
  assert.equal((await handleFeedback(put, ENV)).status, 405)
  assert.equal((await onRequest({ request: post(null, { method: 'GET' }), env: ENV })).status, 405)
})

test('Origin check: site allowed, others refused, previews only with the flag', async () => {
  assert.equal((await run(post(valid()))).response.status, 200)
  assert.equal((await run(post(valid(), { headers: { origin: 'https://evil.example' } }))).response.status, 403)
  assert.equal((await run(post(valid(), { headers: { origin: '' } }))).response.status, 403, 'no Origin and no Referer')
  const preview = { origin: 'https://abc123.cene-sa-pijace.pages.dev' }
  assert.equal((await run(post(valid(), { headers: preview }))).response.status, 403)
  assert.equal((await run(post(valid(), { headers: preview }), { ...ENV, ALLOW_PREVIEW_ORIGINS: 'true' })).response.status, 200)
  const lookalike = { origin: 'https://pages.dev.evil.example' }
  assert.equal((await run(post(valid(), { headers: lookalike }), { ...ENV, ALLOW_PREVIEW_ORIGINS: 'true' })).response.status, 403)
  const viaReferer = post(valid(), { headers: { origin: '', referer: 'https://cenesapijace.org/predlozi' } })
  assert.equal((await run(viaReferer)).response.status, 200)
})

test('body must be JSON and at most 4 KB', async () => {
  assert.equal((await run(post(valid(), { headers: { 'content-type': 'text/plain' } }))).response.status, 415)
  assert.equal((await run(post(null, { raw: '{not json' }))).response.status, 400)
  assert.equal((await run(post(null, { raw: '[1,2]' }))).response.status, 400)
  const big = JSON.stringify(valid({ message: 'x'.repeat(MAX_BODY_BYTES) }))
  assert.equal((await run(post(null, { raw: big }))).response.status, 413)
})

test('server-side validation (lengths, language) answers 400 without writing', async () => {
  const cases = [{ message: 'abc' }, { message: 'x'.repeat(1001) }, { name: 'n'.repeat(61) }, { lang: 'fr' }, { message: undefined }]
  for (const bad of cases) {
    const { response, mock } = await run(post(valid(bad)))
    assert.equal(response.status, 400, JSON.stringify(bad).slice(0, 40))
    assert.equal(mock.calls.append.length, 0)
  }
})

test('honeypot: 200 and nothing is written or verified', async () => {
  const { response, mock } = await run(post(valid({ website: 'http://spam.example' })))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(mock.calls.append.length + mock.calls.turnstile.length + mock.calls.token.length, 0)
})

test('without a (valid) Turnstile token there is no write: 400', async () => {
  let r = await run(post(valid({ token: '' })))
  assert.equal(r.response.status, 400)
  assert.equal(r.mock.calls.append.length, 0)
  r = await run(post(valid({ token: undefined })))
  assert.equal(r.response.status, 400)
  r = await run(post(valid()), ENV, makeMock({ turnstileSuccess: false }))
  assert.equal(r.response.status, 400)
  assert.equal(r.mock.calls.append.length, 0)
})

test('Turnstile siteverify gets the secret, the token and the CF-Connecting-IP', async () => {
  const { mock } = await run(post(valid()))
  assert.deepEqual(mock.calls.turnstile[0], {
    secret: ENV.TURNSTILE_SECRET_KEY,
    response: 'XXXX.DUMMY.TOKEN.XXXX',
    remoteip: '203.0.113.9',
  })
})

test('Sheets append: range, RAW, INSERT_ROWS, column order, no IP / User-Agent', async () => {
  const request = post(valid({ name: 'Ana', message: 'Poruka za test', path: '/city/beograd', lang: 'en' }), {
    headers: { 'user-agent': 'TestBrowser/1.0' },
  })
  const { response, mock } = await run(request)
  assert.equal(response.status, 200)
  assert.equal(mock.calls.append.length, 1)
  const call = mock.calls.append[0]
  const url = new URL(call.url)
  assert.equal(decodeURIComponent(url.pathname), "/v4/spreadsheets/sheet-id-123/values/'Feedback'!A:F:append")
  assert.equal(url.searchParams.get('valueInputOption'), 'RAW')
  assert.equal(url.searchParams.get('insertDataOption'), 'INSERT_ROWS')
  assert.equal(call.headers.authorization, 'Bearer token-1')
  assert.deepEqual(call.body, {
    values: [['2026-11-16T10:20:30.000Z', 'Ana', 'Poruka za test', '/city/beograd', 'en', 'novo']],
  })
  const everything = JSON.stringify(call)
  assert.equal(everything.includes('203.0.113.9'), false)
  assert.equal(everything.includes('TestBrowser'), false)
})

test('FEEDBACK_SHEET_NAME overrides the tab name', async () => {
  const { mock } = await run(post(valid()), { ...ENV, FEEDBACK_SHEET_NAME: "Moj 'tab'" })
  assert.equal(decodeURIComponent(new URL(mock.calls.append[0].url).pathname).includes("'Moj ''tab'''!A:F"), true)
})

test('formula injection: = + - @ get a leading apostrophe; control characters are stripped', async () => {
  const { mock } = await run(post(valid({ name: '=HYPERLINK("x")', message: '@SUM(1)\u0000 ok' })))
  const [, name, message] = mock.calls.append[0].body.values[0]
  assert.equal(name, `'=HYPERLINK("x")`)
  assert.equal(message, "'@SUM(1) ok")
  const second = await run(post(valid({ name: '-1', message: '+cmd|calc' })))
  assert.deepEqual(second.mock.calls.append[0].body.values[0].slice(1, 3), ["'-1", "'+cmd|calc"])
})

test('invalid path is ignored, not an error', async () => {
  const { response, mock } = await run(post(valid({ path: 'javascript:alert(1)' })))
  assert.equal(response.status, 200)
  assert.equal(mock.calls.append[0].body.values[0][3], '')
})

test('service account JWT: RS256, correct claims, valid signature; token cached ~50 min', async () => {
  const mock = makeMock({})
  const send = (message, ip, now) =>
    handleFeedback(post(valid({ message }), { headers: { 'CF-Connecting-IP': ip } }), ENV, { fetchImpl: mock.fetchImpl, now })
  await send('Prva poruka', '203.0.113.9', NOW)
  await send('Druga poruka', '203.0.113.10', NOW + 60_000)
  assert.equal(mock.calls.token.length, 1, 'second post reuses the cached token')

  const { grant_type: grant, assertion } = mock.calls.token[0]
  assert.equal(grant, 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  const [h, c, s] = assertion.split('.')
  const dec = (part) => JSON.parse(Buffer.from(part, 'base64url').toString())
  assert.deepEqual(dec(h), { alg: 'RS256', typ: 'JWT' })
  assert.deepEqual(dec(c), {
    iss: FAKE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: FAKE_ACCOUNT.token_uri,
    iat: NOW / 1000,
    exp: NOW / 1000 + 3600,
  })
  const signatureOk = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    keyPair.publicKey,
    Buffer.from(s, 'base64url'),
    new TextEncoder().encode(`${h}.${c}`),
  )
  assert.equal(signatureOk, true)

  await send('Treca poruka', '203.0.113.11', NOW + 51 * 60_000)
  assert.equal(mock.calls.token.length, 2, 'renewed after ~50 minutes')
})

test('a rejected cached token (401) is renewed once', async () => {
  const mock = makeMock({ sheetsStatus: 200, firstSheetsStatus: 401 })
  const response = await handleFeedback(post(valid()), ENV, { fetchImpl: mock.fetchImpl, now: NOW })
  assert.equal(response.status, 200)
  assert.equal(mock.calls.append.length, 2)
  assert.equal(mock.calls.token.length, 2)
})

test('write failure: generic 500, no Google detail, no content in logs', async () => {
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args.join(' '))
  try {
    const request = post(valid({ name: 'Tajno Ime', message: 'tajna poruka sadrzaj' }))
    const { response } = await run(request, ENV, makeMock({ sheetsStatus: 403 }))
    assert.equal(response.status, 500)
    const text = await response.text()
    assert.deepEqual(JSON.parse(text), { ok: false, error: 'server_error', phase: 'sheets_append', upstream: 403 })
    assert.equal(text.includes('secret detail'), false)
    assert.equal(text.includes('token'), false)
  } finally {
    console.error = original
  }
  assert.deepEqual(logged, ['feedback: phase=sheets_append upstream=403'])
})

test('missing configuration is a 500 naming only the variable', async () => {
  const original = console.error
  console.error = () => {}
  try {
    const { response } = await run(post(valid()), { ...ENV, TURNSTILE_SECRET_KEY: undefined })
    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), {
      ok: false,
      error: 'server_error',
      phase: 'config',
      upstream: null,
      var: 'TURNSTILE_SECRET_KEY',
    })
  } finally {
    console.error = original
  }
})

test('flood brake: the 6th post from one address within 10 minutes is 429', async () => {
  const mock = makeMock({})
  const statuses = []
  for (let i = 0; i < 6; i += 1) {
    const request = post(valid({ message: `poruka broj ${i}` }))
    statuses.push((await handleFeedback(request, ENV, { fetchImpl: mock.fetchImpl, now: NOW + i })).status)
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429])
})
