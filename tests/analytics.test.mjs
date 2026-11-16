import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanParams,
  buildEventParams,
  once,
  enableDebugFromSearch,
  isDebugMode,
  resetDebugMode,
} from '../src/utils/analytics.js'
import { createPageViewTracker } from '../src/utils/pageView.js'
import { getSourceLink } from '../src/utils/sourceLinks.js'

function memoryStorage({ broken = false } = {}) {
  const data = new Map()
  return {
    getItem: (k) => {
      if (broken) throw new Error('blocked')
      return data.has(k) ? data.get(k) : null
    },
    setItem: (k, v) => {
      if (broken) throw new Error('blocked')
      data.set(k, String(v))
    },
    removeItem: (k) => data.delete(k),
  }
}

test('parameters are trimmed, lowercased, and empty ones dropped', () => {
  assert.deepEqual(cleanParams({ a: '  Novi Sad ', b: '', c: null, d: undefined, e: 5, f: 'KG' }), { a: 'novi sad', e: 5, f: 'kg' })
})

test('buildEventParams: debug_mode only when debug is on; transport and raw values', () => {
  assert.deepEqual(buildEventParams({ market: ' Kalenić ' }), { market: 'kalenić' })
  assert.deepEqual(buildEventParams({ market: 'x' }, { debug: true }), { market: 'x', debug_mode: true })
  assert.deepEqual(buildEventParams({ source: 'stips' }, { transport: 'beacon' }), { source: 'stips', transport_type: 'beacon' })
  // page_view keeps case.
  assert.deepEqual(
    buildEventParams({ page_title: 'Kupus Cena', page_location: 'https://x.rs/A' }, { normalize: false }),
    { page_title: 'Kupus Cena', page_location: 'https://x.rs/A' },
  )
})

test('once: the first call runs, later ones do not', () => {
  let calls = 0
  const fire = once((value) => {
    calls += 1
    return value
  })
  assert.equal(fire('a'), 'a')
  assert.equal(fire('b'), undefined)
  assert.equal(calls, 1)
})

test('view_price_history rule: interaction handler fires once per visit, never before data is ready', () => {
  // The same shape Analytics.jsx uses: a guard flag plus the data-ready condition.
  const sent = []
  let ready = false
  let done = false
  const interact = () => {
    if (done || !ready) return
    done = true
    sent.push('view_price_history')
  }
  interact()
  assert.deepEqual(sent, [])
  ready = true
  interact()
  interact()
  interact()
  assert.deepEqual(sent, ['view_price_history'])
})

test('debug mode: ?ga_debug=1 switches it on for the session, otherwise nothing changes', () => {
  const storage = memoryStorage()
  resetDebugMode(storage)
  assert.equal(enableDebugFromSearch('?x=1', storage), false)
  assert.equal(enableDebugFromSearch('?ga_debug=0', storage), false)
  assert.equal(isDebugMode(storage), false)
  assert.equal(enableDebugFromSearch('?utm=a&ga_debug=1', storage), true)
  assert.equal(isDebugMode(storage), true)
  // A later page of the same session has no parameter, but storage remembers.
  const next = memoryStorage()
  next.setItem('ga_debug', '1')
  resetDebugMode(undefined)
  assert.equal(isDebugMode(next), true)
  resetDebugMode(storage)
  resetDebugMode(next)
  assert.equal(isDebugMode(storage), false)
})

test('debug mode works with blocked storage (memory fallback) and never throws', () => {
  const broken = memoryStorage({ broken: true })
  resetDebugMode(undefined)
  assert.equal(isDebugMode(broken), false)
  assert.equal(enableDebugFromSearch('?ga_debug=1', broken), true)
  assert.equal(isDebugMode(broken), true)
  resetDebugMode(undefined)
  assert.equal(isDebugMode(undefined), false)
})

test('source links: only STIPS and JKP Beogradske pijace', () => {
  assert.equal(getSourceLink('STIPS').key, 'stips')
  assert.equal(getSourceLink('JKP Beogradske pijace').key, 'jkp')
  assert.match(getSourceLink('STIPS').url, /^https:\/\//)
  assert.equal(getSourceLink('JKP "Tržnica" Novi Sad'), null)
  assert.equal(getSourceLink(''), null)
  assert.equal(getSourceLink(undefined), null)
})

// ---------------------------------------------------------------- page_view

// A manual clock + head: the title and location change when the test says so.
function setup() {
  let time = 0
  let nextId = 1
  const timers = new Map()
  const state = { title: 'Početna', href: 'https://s.rs/', pathname: '/' }
  const sent = []
  let notify = () => {}
  const tracker = createPageViewTracker({
    send: (p) => sent.push(p),
    getTitle: () => state.title,
    getLocation: () => ({ href: state.href, pathname: state.pathname }),
    observe: (cb) => {
      notify = cb
      return () => {
        notify = () => {}
      }
    },
    setTimer: (fn, ms) => {
      const id = nextId++
      timers.set(id, { fn, at: time + ms })
      return id
    },
    clearTimer: (id) => timers.delete(id),
    now: () => time,
  })
  const advance = (ms) => {
    const target = time + ms
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      time = due[1].at
      timers.delete(due[0])
      due[1].fn()
    }
    time = target
  }
  // What a route change does: URL changes at once, the title a moment later.
  const navigate = (pathname, title, { titleAfter = 80 } = {}) => {
    state.pathname = pathname
    state.href = `https://s.rs${pathname}`
    tracker.routeChanged()
    advance(titleAfter)
    state.title = title
    notify()
  }
  return { tracker, state, sent, advance, navigate, mutate: () => notify() }
}

test('first load: one page_view with the page title, after the head settles', () => {
  const { tracker, sent, advance } = setup()
  tracker.routeChanged()
  advance(100)
  assert.equal(sent.length, 0, 'not before the head has settled')
  advance(400)
  assert.deepEqual(sent, [{ page_title: 'Početna', page_location: 'https://s.rs/', page_path: '/' }])
  advance(5000)
  assert.equal(sent.length, 1)
})

test('route change: page_view carries the NEW title, never the previous page\'s', () => {
  const { tracker, sent, advance, navigate } = setup()
  tracker.routeChanged()
  advance(600)
  navigate('/grad/beograd', 'Cene na pijacama - Beograd')
  advance(1000)
  assert.equal(sent.length, 2)
  assert.deepEqual(sent[1], { page_title: 'Cene na pijacama - Beograd', page_location: 'https://s.rs/grad/beograd', page_path: '/grad/beograd' })
})

test('waits while the title is still the previous one (data loading), then sends the real title', () => {
  const { tracker, state, sent, advance } = setup()
  tracker.routeChanged()
  advance(600)
  state.pathname = '/grad/nis'
  state.href = 'https://s.rs/grad/nis'
  tracker.routeChanged()
  advance(1500)
  assert.equal(sent.length, 1, 'title unchanged: still waiting')
  state.title = 'Cene na pijacama - Niš'
  advance(10)
  advance(400)
  assert.equal(sent.length, 2)
  assert.equal(sent[1].page_title, 'Cene na pijacama - Niš')
})

test('title and canonical set in several steps: sent once, after the last head change', () => {
  const { tracker, state, sent, advance, mutate } = setup()
  tracker.routeChanged()
  advance(600)
  state.pathname = '/grad/x'
  state.href = 'https://s.rs/grad/x'
  tracker.routeChanged()
  advance(50)
  state.title = 'X'
  mutate()
  advance(200)
  mutate() // canonical arrives
  advance(200)
  mutate()
  assert.equal(sent.length, 1, 'still settling')
  advance(600)
  assert.equal(sent.length, 2)
  assert.equal(sent[1].page_title, 'X')
})

test('no duplicates: rapid route changes send only the last; the same URL is never sent twice in a row', () => {
  const { tracker, state, sent, advance, navigate } = setup()
  tracker.routeChanged()
  advance(600)
  navigate('/a', 'A', { titleAfter: 20 })
  navigate('/b', 'B', { titleAfter: 20 })
  advance(1000)
  assert.deepEqual(sent.map((p) => p.page_path), ['/', '/b'])
  // A re-run of the effect on the same route (StrictMode) does not send again.
  tracker.routeChanged()
  advance(5000)
  assert.deepEqual(sent.map((p) => p.page_path), ['/', '/b'])
  assert.equal(state.title, 'B')
})

test('gives up waiting after 3 s and sends what the page has', () => {
  const { tracker, state, sent, advance } = setup()
  tracker.routeChanged()
  advance(600)
  state.pathname = '/stranica'
  state.href = 'https://s.rs/stranica'
  tracker.routeChanged()
  advance(3100)
  assert.equal(sent.length, 2)
  assert.equal(sent[1].page_path, '/stranica')
})
