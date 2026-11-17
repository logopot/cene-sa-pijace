import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldAutoReload, isChunkLoadError, attemptAutoReload, RELOAD_GUARD_MS, SLOW_LOAD_MS } from '../src/utils/chunkReload.js'
import { decidePrefetch, scheduleIdlePrefetch } from '../src/utils/prefetch.js'

const NOW = 1_800_000_000_000

test('the reload decision: first time yes, again within 60 s no, after 60 s yes', () => {
  assert.equal(RELOAD_GUARD_MS, 60_000)
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: null, now: NOW }), true, 'first time')
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: NOW - 1_000, now: NOW }), false, 'a second later: no loop')
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: NOW - 59_999, now: NOW }), false)
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: NOW - 60_000, now: NOW }), true, 'after 60 s')
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: NOW - 3_600_000, now: NOW }), true)
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: NOW + 5_000, now: NOW }), true, 'a time in the future is not a recent reload')
  assert.equal(shouldAutoReload({ storage: 'ok', lastReloadAt: Number.NaN, now: NOW }), true, 'garbage in storage')
})

test('storage unavailable: no automatic reload (it could loop)', () => {
  assert.equal(shouldAutoReload({ storage: 'unavailable', lastReloadAt: null, now: NOW }), false)
})

test('which errors are failed chunk loads', () => {
  for (const message of [
    'Failed to fetch dynamically imported module: https://x/assets/Analytics-DKSOA9Qj.js',
    'error loading dynamically imported module',
    'Importing a module script failed.',
    'Failed to load module script: Expected a JavaScript module script',
  ]) {
    assert.equal(isChunkLoadError(new Error(message)), true, message)
    assert.equal(isChunkLoadError(message), true)
  }
  for (const other of [new Error('Cannot read properties of undefined'), 'network down', null, undefined, {}]) {
    assert.equal(isChunkLoadError(other), false)
  }
})

// A window-less stand-in for sessionStorage and the reload.
function withWindow(storage, run) {
  const original = globalThis.window
  globalThis.window = { sessionStorage: storage, gtag: (...args) => events.push(args) }
  const events = []
  try {
    return run(events)
  } finally {
    globalThis.window = original
  }
}
const memory = () => {
  const data = new Map()
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data }
}
const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }

test('attemptAutoReload: reloads once, records the time, sends chunk_reload with no parameters', () => {
  const storage = memory()
  withWindow(storage, (events) => {
    let reloads = 0
    assert.equal(attemptAutoReload({ now: NOW, reload: () => (reloads += 1) }), true)
    assert.equal(reloads, 1)
    assert.equal(storage.data.get('chunk_reload_at'), String(NOW))
    assert.deepEqual(events, [['event', 'chunk_reload', {}]])
    // again within a minute: no reload, no event
    assert.equal(attemptAutoReload({ now: NOW + 5_000, reload: () => (reloads += 1) }), false)
    assert.equal(reloads, 1)
    assert.equal(events.length, 1)
    // after a minute it may try once more
    assert.equal(attemptAutoReload({ now: NOW + SLOW_LOAD_MS * 5, reload: () => (reloads += 1) }), true)
    assert.equal(reloads, 2)
  })
})

test('attemptAutoReload with blocked storage never reloads', () => {
  withWindow(blocked, (events) => {
    let reloads = 0
    assert.equal(attemptAutoReload({ now: NOW, reload: () => (reloads += 1) }), false)
    assert.equal(reloads, 0)
    assert.deepEqual(events, [])
  })
})

test('slow-load limit is 15 s', () => {
  assert.equal(SLOW_LOAD_MS, 15_000)
})

// ---- background prefetch ------------------------------------------------------

test('prefetch decision: saveData, slow connection, idle-callback support', () => {
  assert.deepEqual(decidePrefetch({ connection: { saveData: true, effectiveType: '4g' }, hasIdleCallback: true }), { prefetch: false, reason: 'saveData' })
  assert.deepEqual(decidePrefetch({ connection: { effectiveType: '2g' }, hasIdleCallback: true }), { prefetch: false, reason: 'slow' })
  assert.deepEqual(decidePrefetch({ connection: { effectiveType: 'slow-2g' }, hasIdleCallback: false }), { prefetch: false, reason: 'slow' })
  assert.deepEqual(decidePrefetch({ connection: { effectiveType: '3g' }, hasIdleCallback: true }), { prefetch: true, mode: 'idle' })
  assert.deepEqual(decidePrefetch({ connection: { effectiveType: '4g', saveData: false }, hasIdleCallback: true }), { prefetch: true, mode: 'idle' })
  assert.deepEqual(decidePrefetch({ connection: undefined, hasIdleCallback: true }), { prefetch: true, mode: 'idle' }, 'no Network Information API')
  assert.deepEqual(decidePrefetch({ connection: undefined, hasIdleCallback: false }), { prefetch: true, mode: 'timeout' }, 'no requestIdleCallback: a ~2 s timer')
})

test('scheduling: idle callback when there is one, a 2 s timer when not, nothing on saveData/slow', async () => {
  const loads = []
  const loader = () => {
    loads.push('chunk')
    return Promise.resolve()
  }
  const calls = []
  const idleWindow = { navigator: {}, requestIdleCallback: (fn) => calls.push(['idle', fn]), setTimeout: (fn, ms) => calls.push(['timeout', fn, ms]) }
  scheduleIdlePrefetch([loader], idleWindow)
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'idle')
  assert.deepEqual(loads, [], 'nothing runs until the browser is idle')
  calls[0][1]()
  assert.deepEqual(loads, ['chunk'])

  const timerCalls = []
  scheduleIdlePrefetch([loader], { navigator: {}, setTimeout: (fn, ms) => timerCalls.push([fn, ms]) })
  assert.equal(timerCalls[0][1], 2000)

  const none = []
  const off = { requestIdleCallback: (fn) => none.push(fn), setTimeout: (fn) => none.push(fn) }
  scheduleIdlePrefetch([loader], { ...off, navigator: { connection: { saveData: true } } })
  scheduleIdlePrefetch([loader], { ...off, navigator: { connection: { effectiveType: '2g' } } })
  assert.equal(none.length, 0)
})

test('a failing prefetch is swallowed: no error, nothing thrown', async () => {
  const calls = []
  const win = { navigator: {}, requestIdleCallback: (fn) => calls.push(fn), setTimeout }
  scheduleIdlePrefetch([() => Promise.reject(new Error('Failed to fetch dynamically imported module')), () => { throw new Error('sync failure') }], win)
  assert.doesNotThrow(() => calls[0]())
  await new Promise((resolve) => setTimeout(resolve, 20))
})
