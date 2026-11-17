import { guardedPrefetch } from './chunkReload.js'

// After the first render, when the browser is idle, the chunks of the main lazy
// routes (the product page - the biggest one) are fetched in the background so they
// are already cached when the visitor clicks. It never touches the first load.

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g'])
const IDLE_FALLBACK_DELAY_MS = 2000
const IDLE_TIMEOUT_MS = 5000

// The decision, pure. `connection` is navigator.connection (may be undefined):
// saved data or a slow connection means no prefetching. mode 'idle' when
// requestIdleCallback exists, else a ~2 s timer.
export function decidePrefetch({ connection, hasIdleCallback }) {
  if (connection?.saveData) return { prefetch: false, reason: 'saveData' }
  if (SLOW_CONNECTIONS.has(connection?.effectiveType)) return { prefetch: false, reason: 'slow' }
  return { prefetch: true, mode: hasIdleCallback ? 'idle' : 'timeout' }
}

// loaders: functions that import() a chunk. Errors are swallowed (guardedPrefetch).
export function scheduleIdlePrefetch(loaders, win = window) {
  if (typeof win === 'undefined') return
  const decision = decidePrefetch({
    connection: win.navigator?.connection,
    hasIdleCallback: typeof win.requestIdleCallback === 'function',
  })
  if (!decision.prefetch) return
  const run = () => {
    for (const load of loaders) guardedPrefetch(load)
  }
  if (decision.mode === 'idle') win.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS })
  else win.setTimeout(run, IDLE_FALLBACK_DELAY_MS)
}
