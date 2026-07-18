import { slugify } from '../utils/productId.js'

// Canonical production origin - kept in one place since it's interpolated
// into absolute og:url/og:image/canonical values across every page (see
// index.html and public/sitemap.xml for the same domain).
export const SITE_URL = 'https://cenesapijace.org'

// Rich-preview fallback used whenever a page doesn't supply its own image
// (see SEO.jsx). Generated at build time by scripts/generate-og-images.mjs
// (see that script and functions/_middleware.js, which serves the same
// per-route images to crawlers server-side before any JS runs).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-fallback.png`

// Mirrors scripts/lib/productLabels.mjs's getCanonicalProductSlug/
// getCanonicalMarketSlug (language-independent identity, kept separate from
// the localized URL slug) so client-side navigation points <SEO image=...>
// at the exact same generated file the build-time manifest does.
export function getProductOgImage(proizvod) {
  return `${SITE_URL}/og/products/${slugify(proizvod)}.png`
}

export function getMarketOgImage(grad, pijaca) {
  return `${SITE_URL}/og/markets/${slugify(grad)}-${slugify(pijaca)}.png`
}
