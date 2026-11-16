// Cloudflare Pages Function - runs at the edge for every request. Injects
// per-route <title>/meta/OG/Twitter tags into the raw index.html *before*
// it reaches the client, so crawlers that never execute JS (Facebook, Viber,
// WhatsApp, iMessage) see accurate previews instead of the one generic
// fallback baked into index.html.
//
// SEO_MANIFEST is a flat, pre-compiled { path -> metadata } map written at
// build time by scripts/generate-seo-map.mjs (see package.json's "prebuild"
// script) - this file only ever does an O(1) object lookup per request, no
// network/database calls happen here.
import { SEO_MANIFEST } from './lib/seo-manifest.mjs'
// Pure string builders shared with the build and the React pages, so the copy
// served here and the copy the app sets after hydration are one rule.
import { manifestEntryCopy, cityInMarketName, marketCopyWithoutCity, categoryCopyWithoutCity } from '../src/utils/seoCopy.js'

const SITE_URL = 'https://cenesapijace.org'

const OG_LOCALE = { sr: 'sr_RS', en: 'en_US' }

// Mirrors public/locales/{sr,en}/translation.json's `seo.*` keys (see
// src/components/SEO/SEO.jsx, the client-side equivalent used for in-app
// navigation). Duplicated here as plain template literals - rather than
// importing the JSON at request time - to keep this edge function
// self-contained and independent of any bundler-specific JSON-import
// behavior. If those translation keys change, update the matching template
// below too.
const HOME_SR = {
  title: 'Aktuelne cene sa pijaca u Srbiji | Pijačni portal',
  description:
    'Pratite svakodnevne promene cena poljoprivrednih proizvoda na pijacama širom Srbije. Brz i jasan uvid u pijačni portal.',
}

const FEEDBACK = {
  sr: {
    title: 'Predlozi i komentari | Cene sa pijace',
    description: 'Pošaljite predlog ili komentar za sajt Cene sa pijace.',
  },
  en: {
    title: 'Suggestions & comments | Cene sa pijace',
    description: 'Send a suggestion or comment about the Cene sa pijace website.',
  },
}

const FALLBACK_SR = {
  title: 'Cene sa pijace | Nezavisni pijačni portal',
  description:
    'Nezavisni pijačni portal u Srbiji. Pratite aktuelne cene poljoprivrednih proizvoda na domaćim pijacama.',
}

const DISCLAIMER = {
  sr: {
    title: 'Odricanje od odgovornosti | Cene sa pijace',
    description: 'Uslovi korišćenja i izvor podataka portala Cene sa pijace - nezavisnog pijačnog portala u Srbiji.',
  },
  en: {
    title: 'Disclaimer | Cene sa pijace',
    description: 'Terms of use and data sources for Cene sa pijace, an independent market price portal in Serbia.',
  },
}

// City, market and category pages get a title built from their own names,
// mirroring the seo.* templates in the locale files. Product pages and the
// Serbian pages of Kvantaška pijaca are built from the manifest entry's own
// facts by manifestEntryCopy (src/utils/seoCopy.js).
// City and market names are already resolved to the right language by the
// manifest (see scripts/generate-seo-map.mjs's translateDataValue calls), so
// this format itself doesn't need a per-language branch.
// A market whose name already holds the generic word ("Green Market", "Market",
// "Zelena pijaca", "Pijaca") must not get it added again by the template. Same
// patterns as hasMarketWord in src/utils/market.js.
function hasMarketWord(name, lang) {
  return lang === 'en' ? /\bmarket\b/i.test(name) : /pijac/i.test(name)
}

function marketCopy(market, city, lang) {
  const generic = hasMarketWord(market, lang)
  if (lang === 'en') {
    return generic
      ? {
          title: `${market} (${city}) - Current Price Overview`,
          description: `Fresh product prices at ${market} in ${city}. Check the offer before you go shopping.`,
        }
      : {
          title: `${market} Market (${city}) - Current Price Overview`,
          description: `Fresh product prices at ${market} market in ${city}. Check the offer before you go shopping.`,
        }
  }
  return generic
    ? {
        title: `${market} (${city}) - Pregled aktuelnih cena`,
        description: `Sveže cene proizvoda: ${market}, ${city}. Proverite ponudu pre odlaska u kupovinu.`,
      }
    : {
        title: `Pijaca ${market} (${city}) - Pregled aktuelnih cena`,
        description: `Sveže cene proizvoda na pijaci ${market} u gradu ${city}. Proverite ponudu pre odlaska u kupovinu.`,
      }
}

function categoryCopy(category, market, city, lang) {
  const generic = hasMarketWord(market, lang)
  const description = `${city} • ${market} • ${category}`
  if (lang === 'en') {
    return { title: `${category} Prices at ${market}${generic ? '' : ' Market'} (${city})`, description }
  }
  return { title: generic ? `${category} - Cene: ${market} (${city})` : `${category} - Cene na pijaci ${market} (${city})`, description }
}

function cityCopy(city, lang) {
  return lang === 'en'
    ? {
        title: `Market Prices in ${city} | Current Prices`,
        description: `Current prices of fruit, vegetables and other goods at the markets in ${city}. Pick a market and compare the offer.`,
      }
    : {
        title: `Cene na pijacama - ${city} | Aktuelne cene`,
        description: `Aktuelne cene voća, povrća i drugih namirnica na pijacama u gradu ${city}. Izaberite pijacu i uporedite ponudu.`,
      }
}

function resolveMeta(pathname) {
  const url = `${SITE_URL}${pathname}`
  const entry = SEO_MANIFEST[pathname]

  if (!entry) {
    return { ...FALLBACK_SR, lang: 'sr', image: `${SITE_URL}/og-fallback.png`, url }
  }

  switch (entry.type) {
    case 'home':
      return { ...HOME_SR, lang: 'sr', image: `${SITE_URL}/og-fallback.png`, url }

    case 'disclaimer': {
      const copy = DISCLAIMER[entry.lang] ?? DISCLAIMER.sr
      return { ...copy, lang: entry.lang, image: `${SITE_URL}/og-fallback.png`, url }
    }

    case 'feedback':
      return { ...(FEEDBACK[entry.lang] ?? FEEDBACK.sr), lang: entry.lang, image: `${SITE_URL}/og-fallback.png`, url }

    case 'city':
      return {
        ...cityCopy(entry.city, entry.lang),
        lang: entry.lang,
        image: `${SITE_URL}/og/cities/${entry.slug}.png`,
        url,
      }

    case 'market':
      return {
        ...(manifestEntryCopy(entry) ??
          (cityInMarketName(entry.market, entry.city)
            ? marketCopyWithoutCity({ lang: entry.lang, market: entry.market, generic: hasMarketWord(entry.market, entry.lang) })
            : marketCopy(entry.market, entry.city, entry.lang))),
        lang: entry.lang,
        image: `${SITE_URL}/og/markets/${entry.slug}.png`,
        url,
      }

    // canonicalPath collapses onto the plain market page when that market's
    // entire catalog is one category (see generate-seo-map.mjs) - the two
    // routes list identical products, so og:url/canonical point at the
    // market page instead of asking search engines to index both.
    case 'category':
      return {
        ...(manifestEntryCopy(entry) ??
          (cityInMarketName(entry.market, entry.city)
            ? categoryCopyWithoutCity({
                lang: entry.lang,
                category: entry.category,
                market: entry.market,
                generic: hasMarketWord(entry.market, entry.lang),
              })
            : categoryCopy(entry.category, entry.market, entry.city, entry.lang))),
        lang: entry.lang,
        image: `${SITE_URL}/og/markets/${entry.slug}.png`,
        url: entry.canonicalPath ? `${SITE_URL}${entry.canonicalPath}` : url,
      }

    case 'product':
      return {
        ...manifestEntryCopy(entry),
        lang: entry.lang,
        image: `${SITE_URL}/og/products/${entry.slug}.png`,
        url,
      }

    default:
      return { ...FALLBACK_SR, lang: 'sr', image: `${SITE_URL}/og-fallback.png`, url }
  }
}

class SetAttribute {
  constructor(attribute, value) {
    this.attribute = attribute
    this.value = value
  }

  element(element) {
    element.setAttribute(this.attribute, this.value)
  }
}

class SetTextContent {
  constructor(value) {
    this.value = value
  }

  element(element) {
    element.setInnerContent(this.value)
  }
}

// Static HTML copy of the page (written at build time by
// scripts/generate-data.mjs into /snap/**) - injected into the shell's empty
// #snapshot container so crawlers and no-JS visitors get real prices in the
// first response. The React app removes the container once it has rendered
// the same content (see src/App.jsx). Best effort: any failure just means
// the plain SPA shell, exactly as before.
async function fetchAsset(context, file) {
  try {
    const res = await context.env.ASSETS.fetch(new URL(file, context.request.url))
    return res.ok ? await res.text() : ''
  } catch {
    return ''
  }
}

// The product page's Product JSON-LD rides at the start of its snapshot (see
// renderProduct in scripts/lib/snapshot.mjs) and is lifted out of it here, so it
// ends up in <head> of the served HTML instead of inside the #snapshot
// container the app deletes.
const PRODUCT_JSON_LD = /^<script type="application\/ld\+json" id="ld-product">[\s\S]*?<\/script>/

function splitJsonLd(html) {
  const jsonLd = html.match(PRODUCT_JSON_LD)?.[0] ?? ''
  return { helpers: jsonLd ? html.slice(jsonLd.length) : html, jsonLd }
}

// Returns { helpers, root, jsonLd }. Every route gets a text snapshot in #snapshot. The
// homepage additionally gets the real prerendered page (scripts/prerender-home.mjs):
// the Serbian markup goes INTO #root (the app hydrates it), and #snapshot holds
// the CSS it needs plus the English copy. If the prerender wasn't produced
// (root is empty), the homepage just keeps its text snapshot.
async function loadSnapshot(context, pathname) {
  const entry = SEO_MANIFEST[pathname]
  if (!entry || entry.type === 'disclaimer' || entry.type === 'feedback') return { helpers: '', root: '', jsonLd: '' }
  if (pathname !== '/') {
    const loaded = splitJsonLd(await fetchAsset(context, `/snap/${pathname.replace(/^\//, '')}.html`))
    // A product page with no price anywhere has no snapshot (nothing to list), but
    // it must not reach crawlers with an empty heading: it carries the product's
    // name (the page stays noindex, see generate-seo-map.mjs).
    if (!loaded.helpers && entry.type === 'product' && entry.name) {
      return { helpers: emptyProductSnapshot(entry), root: '', jsonLd: '' }
    }
    return { ...loaded, root: '' }
  }

  const [helpers, root] = await Promise.all([
    fetchAsset(context, '/snap/index.html'),
    fetchAsset(context, '/snap/index.root.html'),
  ])
  return { helpers, root, jsonLd: '' }
}

const escapeHtml = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

// Same shell as scripts/lib/snapshot.mjs's page(), with the product name only.
function emptyProductSnapshot(entry) {
  return `<header class="snap-head"><a href="/" class="snap-logo">Cene sa pijace</a></header><main class="snap-main" lang="${entry.lang}"><h1>${escapeHtml(entry.name)}</h1></main>`
}

class SetInnerHtml {
  constructor(html) {
    this.html = html
  }

  element(element) {
    element.setInnerContent(this.html, { html: true })
  }
}

class FillPrerenderedRoot {
  constructor(html) {
    this.html = html
  }

  element(element) {
    element.setAttribute('data-prerendered', 'sr')
    element.setInnerContent(this.html, { html: true })
  }
}

class AppendToHead {
  constructor(html) {
    this.html = html
  }

  element(element) {
    element.append(this.html, { html: true })
  }
}

// hreflang alternates for a route whose other-language version exists. The
// manifest's `alt` ({ lang -> path }, written by scripts/generate-seo-map.mjs
// only for verified, reciprocal pairs) lists the other versions; the page links
// to itself too, and x-default is the Serbian version.
function renderHreflang(pathname, entry) {
  if (!entry?.alt) return ''
  const byLang = { ...entry.alt, [entry.lang]: pathname }
  const link = (hreflang, routePath) => `<link rel="alternate" hreflang="${hreflang}" href="${SITE_URL}${routePath}" data-ssr-hreflang>`
  const langs = Object.keys(byLang).sort((a, b) => (a === 'sr' ? -1 : b === 'sr' ? 1 : a.localeCompare(b)))
  return [...langs.map((lang) => link(lang, byLang[lang])), link('x-default', byLang.sr ?? pathname)].join('')
}

class RemoveElement {
  element(element) {
    element.remove()
  }
}

// A path that isn't in the manifest: same shell and generic title as before,
// but marked noindex and with no canonical, so it can never be indexed as a
// page of its own. og:url is left at the shell's default for the same reason.
function rewriteNotFoundHtml(response, meta) {
  return new HTMLRewriter()
    .on('html', new SetAttribute('lang', meta.lang))
    .on('title', new SetTextContent(meta.title))
    .on('meta[name="description"]', new SetAttribute('content', meta.description))
    .on('meta[property="og:title"]', new SetAttribute('content', meta.title))
    .on('meta[property="og:description"]', new SetAttribute('content', meta.description))
    .on('meta[name="twitter:title"]', new SetAttribute('content', meta.title))
    .on('meta[name="twitter:description"]', new SetAttribute('content', meta.description))
    .on('link[rel="canonical"]', new RemoveElement())
    .on('head', new AppendToHead('<meta name="robots" content="noindex">'))
    .transform(response)
}

// A product route nobody has a price for: still served (200, same canonical and
// hreflang), but kept out of search until data returns - and out of sitemap.xml
// (see markPricelessRoutes in scripts/generate-seo-map.mjs).
const NOINDEX_META = '<meta name="robots" content="noindex">'

function rewriteHtml(response, meta, snapshot, hreflang, noindex) {
  const rewriter = new HTMLRewriter()
    .on('html', new SetAttribute('lang', meta.lang))
    .on('title', new SetTextContent(meta.title))
    .on('meta[name="description"]', new SetAttribute('content', meta.description))
    .on('meta[property="og:title"]', new SetAttribute('content', meta.title))
    .on('meta[property="og:description"]', new SetAttribute('content', meta.description))
    .on('meta[property="og:image"]', new SetAttribute('content', meta.image))
    .on('meta[property="og:url"]', new SetAttribute('content', meta.url))
    .on('meta[property="og:locale"]', new SetAttribute('content', OG_LOCALE[meta.lang] ?? OG_LOCALE.sr))
    .on('meta[name="twitter:title"]', new SetAttribute('content', meta.title))
    .on('meta[name="twitter:description"]', new SetAttribute('content', meta.description))
    .on('meta[name="twitter:image"]', new SetAttribute('content', meta.image))
    .on('link[rel="canonical"]', new SetAttribute('href', meta.url))

  if (snapshot.helpers) rewriter.on('div#snapshot', new SetInnerHtml(snapshot.helpers))
  if (snapshot.root) rewriter.on('div#root', new FillPrerenderedRoot(snapshot.root))
  if (snapshot.jsonLd) rewriter.on('head', new AppendToHead(snapshot.jsonLd))
  if (hreflang) rewriter.on('head', new AppendToHead(hreflang))
  if (noindex) rewriter.on('head', new AppendToHead(NOINDEX_META))
  return rewriter.transform(response)
}

export async function onRequest(context) {
  const { request, next } = context
  const response = await next()

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const url = new URL(request.url)

  // The SPA fallback (public/_redirects) serves index.html with 200 for every
  // path, so any HTML request the manifest doesn't know is a page that doesn't
  // exist - under /grad|/city and anywhere else (/xyz, /en). Real files
  // (/sitemap.xml, /robots.txt, assets) aren't HTML and returned above.
  if (!SEO_MANIFEST[url.pathname]) {
    const page = rewriteNotFoundHtml(response, { ...FALLBACK_SR, lang: 'sr' })
    const headers = new Headers(page.headers)
    headers.set('X-Robots-Tag', 'noindex')
    return new Response(page.body, { status: 404, statusText: 'Not Found', headers })
  }

  const meta = resolveMeta(url.pathname)
  const snapshot = await loadSnapshot(context, url.pathname)
  const entry = SEO_MANIFEST[url.pathname]
  return rewriteHtml(response, meta, snapshot, renderHreflang(url.pathname, entry), Boolean(entry.noindex))
}
