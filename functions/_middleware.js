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

const SITE_URL = 'https://cenesapijace.org'

// The city-path prefixes the app routes on (CITY_PATH_PREFIX in
// src/constants/routeLocales.js: /grad/... for sr, /city/... for en). Every
// real page under them is in SEO_MANIFEST - the same map the sitemap is
// written from - so a path here that the manifest doesn't know is a page that
// doesn't exist.
const CITY_ROUTE = /^\/(?:grad|city)(?:\/|$)/
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

// City, market and product pages each get a distinct title built from their
// own name, mirroring the seo.* templates in the locale files.
function productCopy(name, lang) {
  return lang === 'en'
    ? {
        title: `${name} - Current Price at Serbian Markets`,
        description: `Find out how much ${name} costs today at green market stalls. Compare the lowest and highest prices by city.`,
      }
    : {
        title: `${name} - Aktuelna cena na pijacama u Srbiji`,
        description: `Saznajte koliko danas košta ${name} na pijačnim tezgama. Pogledajte najniže i najviše cene po gradovima.`,
      }
}

// City and market names are already resolved to the right language by the
// manifest (see scripts/generate-seo-map.mjs's translateDataValue calls), so
// this format itself doesn't need a per-language branch.
function marketCopy(market, city, lang) {
  return lang === 'en'
    ? {
        title: `${market} Market (${city}) - Current Price Overview`,
        description: `Fresh product prices at ${market} market in ${city}. Check the offer before you go shopping.`,
      }
    : {
        title: `Pijaca ${market} (${city}) - Pregled aktuelnih cena`,
        description: `Sveže cene proizvoda na pijaci ${market} u gradu ${city}. Proverite ponudu pre odlaska u kupovinu.`,
      }
}

function categoryCopy(category, market, city, lang) {
  return lang === 'en'
    ? { title: `${category} Prices at ${market} Market (${city})`, description: `${city} • ${market} • ${category}` }
    : { title: `${category} - Cene na pijaci ${market} (${city})`, description: `${city} • ${market} • ${category}` }
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

    case 'city':
      return {
        ...cityCopy(entry.city, entry.lang),
        lang: entry.lang,
        image: `${SITE_URL}/og/cities/${entry.slug}.png`,
        url,
      }

    case 'market':
      return {
        ...marketCopy(entry.market, entry.city, entry.lang),
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
        ...categoryCopy(entry.category, entry.market, entry.city, entry.lang),
        lang: entry.lang,
        image: `${SITE_URL}/og/markets/${entry.slug}.png`,
        url: entry.canonicalPath ? `${SITE_URL}${entry.canonicalPath}` : url,
      }

    case 'product':
      return {
        ...productCopy(entry.name, entry.lang),
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
  if (!entry || entry.type === 'disclaimer') return { helpers: '', root: '', jsonLd: '' }
  if (pathname !== '/') {
    return { ...splitJsonLd(await fetchAsset(context, `/snap${pathname}.html`)), root: '' }
  }

  const [helpers, root] = await Promise.all([
    fetchAsset(context, '/snap/index.html'),
    fetchAsset(context, '/snap/index.root.html'),
  ])
  return { helpers, root, jsonLd: '' }
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

function rewriteHtml(response, meta, snapshot) {
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
  return rewriter.transform(response)
}

export async function onRequest(context) {
  const { request, next } = context
  const response = await next()

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const url = new URL(request.url)

  if (CITY_ROUTE.test(url.pathname) && !SEO_MANIFEST[url.pathname]) {
    const page = rewriteNotFoundHtml(response, { ...FALLBACK_SR, lang: 'sr' })
    const headers = new Headers(page.headers)
    headers.set('X-Robots-Tag', 'noindex')
    return new Response(page.body, { status: 404, statusText: 'Not Found', headers })
  }

  const meta = resolveMeta(url.pathname)
  const snapshot = await loadSnapshot(context, url.pathname)
  return rewriteHtml(response, meta, snapshot)
}
