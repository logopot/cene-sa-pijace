// Fetches actual TTF font bytes for satori (see scripts/generate-og-images.mjs)
// - satori needs a real font binary per weight, not a CSS @font-face link, and
// this project doesn't vendor any font files (index.html just links Google
// Fonts' CSS for the browser). Google's variable-font CSS2 endpoint normally
// serves WOFF2, which satori/resvg can't parse; requesting it with an old
// Android WebKit User-Agent (predates WOFF2 support) makes Google serve a
// static per-weight TTF instead - a well-known, if hacky, technique.
const LEGACY_UA =
  'Mozilla/5.0 (Linux; U; Android 2.3.6; en-us; Nexus S Build/GRK39F) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'

async function fetchTtfUrl(family, weight) {
  const familyParam = encodeURIComponent(family)
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&display=swap`
  const res = await fetch(cssUrl, { headers: { 'User-Agent': LEGACY_UA } })
  if (!res.ok) throw new Error(`Google Fonts CSS request failed for ${family} ${weight}: ${res.status}`)
  const css = await res.text()
  const match = css.match(/url\(([^)]+\.ttf)\)/)
  if (!match) throw new Error(`No .ttf URL found in Google Fonts response for ${family} ${weight}`)
  return match[1]
}

// In-memory only - each build run is a fresh process, and re-downloading a
// handful of small TTFs once per build is cheap enough not to need a
// persistent on-disk cache.
const cache = new Map()

export async function loadGoogleFontWeight(family, weight) {
  const cacheKey = `${family}:${weight}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const ttfUrl = await fetchTtfUrl(family, weight)
  const res = await fetch(ttfUrl)
  if (!res.ok) throw new Error(`Failed to download font file for ${family} ${weight}: ${res.status}`)
  const data = await res.arrayBuffer()
  cache.set(cacheKey, data)
  return data
}
