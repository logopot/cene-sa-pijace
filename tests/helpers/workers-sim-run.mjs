// Run by tests/workers-sim.test.mjs in a separate process. Simulates the Workers
// runtime without nodejs_compat: Buffer and process are removed BEFORE the
// endpoint is imported, and everything below uses Web APIs only. Prints one JSON
// line with what happened.
const hadBuffer = typeof globalThis.Buffer !== 'undefined'
const hadProcess = typeof globalThis.process !== 'undefined'
// Capture what the report needs, then remove the Node-only globals.
const out = (value) => console.log(JSON.stringify(value))
// Node loads its fetch classes lazily and they need Buffer while loading: touch
// them first, then remove the globals.
void Headers
delete globalThis.Buffer
delete globalThis.process
const stillThere = { hadBuffer: typeof globalThis.Buffer !== 'undefined', hadProcess: typeof globalThis.process !== 'undefined' }
if (stillThere.hadBuffer || stillThere.hadProcess) throw new Error('could not remove Node globals')
void hadBuffer
void hadProcess

// Node's own Request/Response (undici) read the global Buffer internally, which
// has nothing to do with the code under test; Workers have native ones. Stand-ins
// with the few members the endpoint uses keep the simulation about OUR code.
class SimResponse {
  constructor(body, init = {}) {
    this.body = body ?? ''
    this.status = init.status ?? 200
    this.headers = new Headers(init.headers)
  }
  get ok() {
    return this.status >= 200 && this.status < 300
  }
  text() {
    return Promise.resolve(String(this.body))
  }
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
  static json(value, init) {
    return new SimResponse(JSON.stringify(value), init)
  }
}
class SimRequest {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method ?? 'GET'
    this.headers = new Headers(init.headers)
    this.body = init.body
  }
  text() {
    return Promise.resolve(String(this.body ?? ''))
  }
}
globalThis.Response = SimResponse
globalThis.Request = SimRequest

const { handleFeedback } = await import('../../functions/lib/feedback.js')

const toBase64 = (bytes) => {
  let binary = ''
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte)
  return btoa(binary)
}
const fromBase64Url = (text) => {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

const keyPair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)
const der = toBase64(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey))
const account = {
  client_email: 'forms@example-project.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----\n${der.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`,
  token_uri: 'https://oauth2.example.test/token',
}
const env = {
  FEEDBACK_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
  FEEDBACK_SPREADSHEET_ID: 'sheet-id-123',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
}

let assertion = ''
let appended = null
let appendCalls = 0
const fetchImpl = async (url, init) => {
  url = String(url)
  if (url.includes('siteverify')) return Response.json({ success: true })
  if (url === account.token_uri) {
    assertion = new URLSearchParams(init.body).get('assertion')
    return Response.json({ access_token: 'token-1', expires_in: 3600 })
  }
  appendCalls += 1
  appended = JSON.parse(init.body).values[0]
  return new Response('{}', { status: 200 })
}

const request = new Request('https://cenesapijace.org/api/feedback', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://cenesapijace.org', 'CF-Connecting-IP': '203.0.113.9' },
  body: JSON.stringify({ name: 'Ana', message: 'Poruka iz Workers simulacije', page: '/grad/beograd', lang: 'sr', website: '', token: 'XXXX.DUMMY.TOKEN.XXXX' }),
})
const response = await handleFeedback(request, env, { fetchImpl, now: Date.parse('2026-11-16T10:20:30.000Z') })

const [h, c, s] = assertion.split('.')
const signatureValid = await crypto.subtle.verify(
  'RSASSA-PKCS1-v1_5',
  keyPair.publicKey,
  fromBase64Url(s),
  new TextEncoder().encode(`${h}.${c}`),
)

out({ ...stillThere, status: response.status, body: await response.json(), appendCalls, row: appended, signatureValid })
