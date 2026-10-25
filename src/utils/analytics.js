// Single place every GA4 custom event goes through (gtag itself is loaded by
// the snippet in index.html). Events are sent only from real user actions or
// once per page view, never carry personal data, and every string parameter
// is normalized (trimmed, lowercased) so GA4 reports don't split one value
// into several spellings.
//
// Event catalogue - parameters are all strings:
//   filter_city        city
//   filter_category    category
//   filter_market      market
//   search_submit      city, category, market
//   view_market        market_name, city
//   view_product       product_name, category, market_name
//   view_price_history product_name
//   click_source_link  source, product_name, market_name  (not wired yet: the
//                      UI shows the source as plain text, there is no link to
//                      the official report to click)
//   language_switch    from, to
//   share_click        (not wired: the site has no share control)
// scroll depth is covered by GA4's built-in Enhanced Measurement ("scroll"),
// so no extra code or weight is added for it.
import { ALL_CATEGORIES, ALL_MARKETS } from '../constants/filters.js'

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

function cleanParams(params) {
  const cleaned = {}
  for (const [key, raw] of Object.entries(params)) {
    const value = normalizeValue(raw)
    if (value === undefined || value === null || value === '') continue
    cleaned[key] = value
  }
  return cleaned
}

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, cleanParams(params))
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
