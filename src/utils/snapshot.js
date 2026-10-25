// The edge middleware pre-fills #snapshot with a static HTML copy of the
// page (see functions/_middleware.js) so crawlers and no-JS visitors get real
// content. It stays on screen until the React app has rendered the same
// content, then is removed - so while it's up, the app must not render a
// second loading state beneath it.
import { useLayoutEffect, useSyncExternalStore } from 'react'

const SNAPSHOT_ID = 'snapshot'

export function hasSnapshot() {
  if (typeof document === 'undefined') return false
  const element = document.getElementById(SNAPSHOT_ID)
  return Boolean(element && element.childElementCount > 0)
}

// Drops the prerender leftovers: the #snapshot helper container (inline CSS +
// the English copy) and the marker that hides the Serbian root for English
// visitors, whose root is rebuilt by createRoot instead of hydrated.
export function removeSnapshot() {
  if (typeof document === 'undefined') return
  document.getElementById(SNAPSHOT_ID)?.remove()
  document.getElementById('root')?.removeAttribute('data-prerendered')
}

// The app stylesheet is injected as <link media="print" onload="this.media='all'">
// (see vite.config.js) so it doesn't block first paint; this reports when it
// has switched to "all", i.e. actually applies. Always true when the link isn't
// there (dev server, or CSS already inlined).
function getPendingStylesheet() {
  if (typeof document === 'undefined') return null
  return document.querySelector('link[rel="stylesheet"][media="print"]')
}

export function subscribeToStyles(callback) {
  const link = getPendingStylesheet()
  if (!link) return () => {}
  link.addEventListener('load', callback)
  return () => link.removeEventListener('load', callback)
}

export function getStylesReady() {
  return getPendingStylesheet() === null
}

// Removes the prerender leftovers once this component has committed AND the app
// stylesheet applies. Call it from a component that sits inside the route
// Suspense boundary (the homepage's MarketExplorer): when the page is hydrated,
// that boundary hydrates after the shell, and the prerender's inline CSS must
// outlive every component that hasn't yet injected its own styles - removing it
// from the shell would drop styles from not-yet-hydrated parts and shift them.
export function useRemoveSnapshotWhenReady() {
  const stylesReady = useSyncExternalStore(subscribeToStyles, getStylesReady, () => true)
  useLayoutEffect(() => {
    if (stylesReady) removeSnapshot()
  }, [stylesReady])
}
