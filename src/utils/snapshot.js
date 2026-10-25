// The edge middleware pre-fills #snapshot with a static HTML copy of the
// page (see functions/_middleware.js) so crawlers and no-JS visitors get real
// content. It stays on screen until the React app has rendered the same
// content, then is removed - so while it's up, the app must not render a
// second loading state beneath it.
const SNAPSHOT_ID = 'snapshot'

export function hasSnapshot() {
  if (typeof document === 'undefined') return false
  const element = document.getElementById(SNAPSHOT_ID)
  return Boolean(element && element.childElementCount > 0)
}

export function removeSnapshot() {
  if (typeof document === 'undefined') return
  document.getElementById(SNAPSHOT_ID)?.remove()
}
