import { trackRawEvent } from './analytics.js'

// page_view for a single-page app. The gtag config has send_page_view:false, so
// the one page_view of every page - the first load and each later route change -
// comes from here. It is sent only after the page has set its own document.title
// and canonical (Helmet applies them a moment after the route renders), so
// page_title is never the previous page's. GA4's "Page changes based on browser
// history events" enhanced measurement must be OFF (README, "GA4 događaji"),
// otherwise it would add a second page_view on every route change, with the old
// title.
//
// After a route change: wait until the <head> has stopped changing for SETTLE_MS
// (and at least MIN_WAIT_MS passed); on a later route also until the title is no
// longer the previous page's; give up waiting after MAX_WAIT_MS and send what
// there is. The same URL is never sent twice in a row.
export const SETTLE_MS = 250
export const MIN_WAIT_MS = 300
export const MAX_WAIT_MS = 3000

// Everything the environment provides is injected, so the timing is testable.
export function createPageViewTracker({
  send,
  getTitle,
  getLocation,
  observe = () => () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  now = Date.now,
  settleMs = SETTLE_MS,
  minWaitMs = MIN_WAIT_MS,
  maxWaitMs = MAX_WAIT_MS,
}) {
  let pending = null
  let lastHref = ''
  let first = true

  function cancel() {
    if (!pending) return
    clearTimer(pending.settleTimer)
    clearTimer(pending.maxTimer)
    pending.stopObserving()
    pending = null
  }

  function flush() {
    if (!pending) return
    cancel()
    const location = getLocation()
    if (location.href === lastHref) return
    lastHref = location.href
    send({ page_title: getTitle(), page_location: location.href, page_path: location.pathname })
  }

  function arm() {
    if (!pending) return
    clearTimer(pending.settleTimer)
    pending.settleTimer = setTimer(() => {
      if (!pending) return
      const settled = now() - pending.startedAt >= minWaitMs
      const titled = !pending.requireTitleChange || getTitle() !== pending.startTitle
      if (settled && titled) flush()
      else arm()
    }, settleMs)
  }

  return {
    // Call when the route (pathname) has changed - and once on the first render.
    routeChanged() {
      cancel()
      pending = {
        startedAt: now(),
        startTitle: getTitle(),
        // The first page load arrives with its title already in the HTML; later
        // routes must show a new title before it counts as set.
        requireTitleChange: !first,
        settleTimer: null,
        maxTimer: null,
        stopObserving: () => {},
      }
      first = false
      pending.stopObserving = observe(arm)
      pending.maxTimer = setTimer(flush, maxWaitMs)
      arm()
    },
    cancel,
  }
}

let browserTracker = null

// The tracker bound to the real page. Created on first use in the browser.
export function getPageViewTracker() {
  if (browserTracker || typeof window === 'undefined') return browserTracker
  browserTracker = createPageViewTracker({
    send: (params) => trackRawEvent('page_view', params),
    getTitle: () => document.title,
    getLocation: () => ({
      href: `${window.location.origin}${window.location.pathname}${window.location.search}`,
      pathname: window.location.pathname,
    }),
    observe: (callback) => {
      const observer = new MutationObserver(callback)
      observer.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true })
      return () => observer.disconnect()
    },
  })
  return browserTracker
}
