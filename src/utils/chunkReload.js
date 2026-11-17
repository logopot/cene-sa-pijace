import { trackEvent } from './analytics.js'

// A visitor whose tab (or cached index.html) predates a deploy asks for hashed lazy
// chunks that no longer exist: the dynamic import fails and the page would sit on
// its spinner forever. Self-healing: on the first such failure the page reloads
// itself once (the new index.html names the new chunks); if that does not help, the
// visitor sees a message with a "Refresh" button instead of a spinner - and the page
// never reloads in a loop.

export const RELOAD_GUARD_MS = 60_000
export const SLOW_LOAD_MS = 15_000
const STORAGE_KEY = 'chunk_reload_at'

// What a failed dynamic import says, by browser.
const CHUNK_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|unable to preload css/i

export function isChunkLoadError(error) {
  const message = typeof error === 'string' ? error : (error?.message ?? '')
  return CHUNK_ERROR_PATTERN.test(String(message))
}

// The decision, pure: reload when there is no earlier automatic reload within the
// guard window. Without usable storage the time of the last reload cannot be kept
// across the reload itself, so reloading could loop: then it does not reload.
//   storage: 'ok' | 'unavailable'; lastReloadAt: ms or null
export function shouldAutoReload({ storage, lastReloadAt, now, windowMs = RELOAD_GUARD_MS }) {
  if (storage !== 'ok') return false
  if (lastReloadAt === null || lastReloadAt === undefined || Number.isNaN(Number(lastReloadAt))) return true
  const elapsed = now - Number(lastReloadAt)
  // A time in the future (clock changed) is not "recent": it cannot be trusted.
  return elapsed < 0 || elapsed >= windowMs
}

function readStorage() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return { storage: 'ok', lastReloadAt: raw === null ? null : Number(raw) }
  } catch {
    return { storage: 'unavailable', lastReloadAt: null }
  }
}

// Reloads the page on the same URL if the guard allows it; returns whether it did.
// The GA4 event carries no parameters - no path, no error text.
export function attemptAutoReload({ now = Date.now(), reload = () => window.location.reload() } = {}) {
  const { storage, lastReloadAt } = readStorage()
  if (!shouldAutoReload({ storage, lastReloadAt, now })) return false
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    return false
  }
  trackEvent('chunk_reload')
  reload()
  return true
}

// Background prefetching (see prefetch.js) must neither fail the page nor reload it:
// while one is running, preload errors are swallowed here.
let prefetchDepth = 0

export async function guardedPrefetch(load) {
  prefetchDepth += 1
  try {
    await load()
  } catch {
    // Ignored on purpose: a failed prefetch changes nothing; the page loads the chunk
    // itself when it is needed.
  } finally {
    // The preload error event fires on a later tick than the rejection.
    setTimeout(() => {
      prefetchDepth -= 1
    }, 0)
  }
}

// vite:preloadError (Vite's own event for a failed dynamic import / preload) and
// unhandled rejections that look like one. Installed once, from main.jsx.
export function installChunkErrorHandlers(win = window) {
  win.addEventListener('vite:preloadError', (event) => {
    if (prefetchDepth > 0) {
      event.preventDefault()
      return
    }
    // Reloading? Then the error is not needed. Not allowed (already tried): let it
    // through - the error boundary around the lazy routes shows the message.
    if (attemptAutoReload()) event.preventDefault()
  })
  win.addEventListener('unhandledrejection', (event) => {
    if (prefetchDepth > 0 || !isChunkLoadError(event.reason)) return
    if (attemptAutoReload()) event.preventDefault()
  })
}
