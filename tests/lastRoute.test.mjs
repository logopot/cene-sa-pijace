import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { rememberRoute, readLastRoute, normalizeRoute, resetLastRoute } from '../src/utils/lastRoute.js'

// A tiny sessionStorage stand-in; `broken` makes every access throw, like a
// browser with storage blocked.
function installStorage({ broken = false } = {}) {
  const data = new Map()
  const storage = {
    getItem: (key) => {
      if (broken) throw new Error('blocked')
      return data.has(key) ? data.get(key) : null
    },
    setItem: (key, value) => {
      if (broken) throw new Error('blocked')
      data.set(key, String(value))
    },
    removeItem: (key) => data.delete(key),
  }
  globalThis.window = { sessionStorage: storage }
  return data
}

beforeEach(() => {
  installStorage()
  resetLastRoute()
})

test('remembers the pathname of the last visited page', () => {
  rememberRoute('/grad/novi-sad')
  rememberRoute('/grad/novi-sad/kvantaska-pijaca/povrce/kupus-sve-sorte')
  assert.equal(readLastRoute(), '/grad/novi-sad/kvantaska-pijaca/povrce/kupus-sve-sorte')
})

test('the form routes themselves are ignored (sr and en)', () => {
  rememberRoute('/grad/beograd')
  rememberRoute('/predlozi')
  rememberRoute('/feedback')
  assert.equal(readLastRoute(), '/grad/beograd')
})

test('only the pathname is kept: no query, no hash', () => {
  assert.equal(normalizeRoute('/city/beograd?utm=x#top'), '/city/beograd')
  rememberRoute('/city/beograd?utm=x#top')
  assert.equal(readLastRoute(), '/city/beograd')
})

test('longer than 200 characters is cut to 200; unsafe or malformed values are not stored', () => {
  assert.equal(normalizeRoute('/' + 'a'.repeat(300)).length, 200)
  const before = '/grad/beograd'
  rememberRoute(before)
  for (const bad of ['javascript:alert(1)', 'grad/x', '//evil.example', '/a b', '/<script>', '', null, undefined, 42]) {
    rememberRoute(bad)
    assert.equal(readLastRoute(), before, String(bad))
  }
})

test('survives a refresh: read back from sessionStorage', () => {
  const data = installStorage()
  resetLastRoute()
  rememberRoute('/grad/subotica')
  assert.equal(data.get('lr'), '/grad/subotica')
  // Fresh page load: module memory is gone, storage is not.
  const stored = new Map([['lr', '/grad/subotica']])
  globalThis.window = { sessionStorage: { getItem: (k) => stored.get(k) ?? null, setItem() {}, removeItem() {} } }
  assert.equal(readLastRoute(), '/grad/subotica')
})

test('a tampered stored value is sanitized on the way out', () => {
  const data = installStorage()
  data.set('lr', 'https://evil.example/x')
  assert.equal(readLastRoute(), '')
  data.set('lr', '/predlozi')
  assert.equal(readLastRoute(), '')
})

test('works without sessionStorage (blocked, or absent): falls back to memory', () => {
  installStorage({ broken: true })
  rememberRoute('/grad/beograd/kalenic')
  assert.equal(readLastRoute(), '/grad/beograd/kalenic')
  delete globalThis.window
  rememberRoute('/grad/nis')
  assert.equal(readLastRoute(), '/grad/nis')
})

test('nothing visited yet: empty (direct visit of the form)', () => {
  assert.equal(readLastRoute(), '')
})
