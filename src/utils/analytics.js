// Single place every GA4 event goes through (gtag itself is loaded by the
// snippet in index.html, which is configured with send_page_view:false - page
// views are sent from here, see pageView.js). Events are sent only from real user
// actions or once per page view, never carry personal data, and every string
// parameter is normalized (trimmed, lowercased) so GA4 reports don't split one
// value into several spellings.
//
// Event catalogue - parameters are all strings (README "GA4 događaji" has the
// same table with the key-event column):
//   page_view          page_title, page_location, page_path  (pageView.js: after
//                      every route change, once the page set its title/canonical;
//                      values are sent as they are, not lowercased)
//   filter_city        city
//   filter_category    category
//   filter_market      market
//   search_submit      city, category, market
//   view_market        market_name, city
//   view_product       product_name, market, market_name, city, category  (once per
//                      product page visit, when its data is loaded)
//   view_price_history product_name, market, market_name, city, category  (first
//                      real use of the history chart or its variety tabs, at most
//                      once per product page visit - never automatic)
//   click_source_link  source (stips|jkp), page_type, product_name  (click on a
//                      link to the official source; sent with transport beacon)
//   language_switch    from, to
//   chunk_reload       (no parameters: the page reloaded itself once because a lazy
//                      chunk from an older deploy could not be loaded)
//   feedback_open      from_page_type  (kind of page the suggestions form was
//                      opened from: home, city, market, category, product, other
//                      - never the path; the form's text is never sent anywhere)
//   feedback_submit    (successful send of the suggestions form)
// scroll depth is covered by GA4's built-in Enhanced Measurement ("scroll"),
// so no extra code or weight is added for it.
//
// Debug: opening any page with ?ga_debug=1 turns debug_mode:true on for every
// event of that browser session (sessionStorage), so they show up in GA4
// DebugView. Without the parameter nothing changes.
import { ALL_CATEGORIES, ALL_MARKETS } from '../constants/filters.js'

export const DEBUG_PARAM = 'ga_debug'
const DEBUG_STORAGE_KEY = 'ga_debug'

function normalizeValue(value) {
  if (typeof value !== 'string') return value
  return value.trim().toLowerCase()
}

// The filter dropdowns' internal "everything" sentinels read as "all" in
// reports instead of leaking implementation strings.
export function filterParam(value) {
  if (value === ALL_CATEGORIES || value === ALL_MARKETS) return 'all'
  return value
}

// Normalizes every string and drops empty values, so no event carries a blank
// parameter.
export function cleanParams(params) {
  const cleaned = {}
  for (const [key, raw] of Object.entries(params)) {
    const value = normalizeValue(raw)
    if (value === undefined || value === null || value === '') continue
    cleaned[key] = value
  }
  return cleaned
}

// ----------------------------------------------------------------- debug mode

let debugInMemory = false

// Reads ?ga_debug=1 from a query string and, if present, remembers it for the
// session (memory too, for browsers where sessionStorage is blocked).
export function enableDebugFromSearch(search, storage) {
  if (new URLSearchParams(search ?? '').get(DEBUG_PARAM) !== '1') return false
  debugInMemory = true
  try {
    storage?.setItem(DEBUG_STORAGE_KEY, '1')
  } catch {
    // Storage blocked: the in-memory flag still covers this page load.
  }
  return true
}

export function isDebugMode(storage) {
  if (debugInMemory) return true
  try {
    return storage?.getItem(DEBUG_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function resetDebugMode(storage) {
  debugInMemory = false
  try {
    storage?.removeItem(DEBUG_STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}

function getSessionStorage() {
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

if (typeof window !== 'undefined') enableDebugFromSearch(window.location.search, getSessionStorage())

// ------------------------------------------------------------------ sending

// The parameter object gtag receives. `normalize:false` is for values that must
// keep their case (page_view's title and URL).
export function buildEventParams(params, { debug = false, transport, normalize = true } = {}) {
  const base = normalize ? cleanParams(params) : params
  return {
    ...base,
    ...(transport && { transport_type: transport }),
    ...(debug && { debug_mode: true }),
  }
}

function send(name, params, options) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, buildEventParams(params, { debug: isDebugMode(getSessionStorage()), ...options }))
}

// options.transport: 'beacon' for events fired as the page is being left (a
// click on an outbound link).
export function trackEvent(name, params = {}, options = {}) {
  send(name, params, options)
}

// page_view and anything else whose values must not be lowercased.
export function trackRawEvent(name, params = {}) {
  send(name, params, { normalize: false })
}

// For page-level events fired from effects: skips an immediate repeat of the
// exact same event (React StrictMode's double effect run in development, or a
// re-render that re-runs the effect) so one page view counts once.
let lastPageEventKey = ''

export function trackPageEvent(name, params = {}) {
  const key = `${name}|${JSON.stringify(cleanParams(params))}`
  if (key === lastPageEventKey) return
  lastPageEventKey = key
  trackEvent(name, params)
}

// A function that runs its first call only - "at most once per page visit" for
// events fired from interactions (the component that owns it remounts per route).
export function once(fn) {
  let done = false
  return (...args) => {
    if (done) return undefined
    done = true
    return fn(...args)
  }
}
