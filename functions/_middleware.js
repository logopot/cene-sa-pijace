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
const OG_LOCALE = { sr: 'sr_RS', en: 'en_US' }

// Mirrors public/locales/{sr,en}/translation.json's `seo.*` keys (see
// src/components/SEO/SEO.jsx, the client-side equivalent used for in-app
// navigation). Duplicated here as plain template literals - rather than
// importing the JSON at request time - to keep this edge function
// self-contained and independent of any bundler-specific JSON-import
// behavior. If those translation keys change, update the matching template
// below too.
const HOME_SR = {
  title: 'Trenutne cene sa pijaca u Srbiji | Pijačni barometar',
  description:
    'Pratite svakodnevne promene cena poljoprivrednih proizvoda na pijacama širom Srbije. Brz i jasan uvid u pijačni barometar.',
}

const FALLBACK_SR = {
  title: 'Cene sa pijace | Nezavisni pijačni barometar',
  description:
    'Nezavisni pijačni barometar u Srbiji. Pratite svakodnevne promene i pregled trenutnih cena poljoprivrednih proizvoda na pijacama širom zemlje.',
}

const DISCLAIMER = {
  sr: {
    title: 'Odricanje od odgovornosti | Cene sa pijace',
    description:
      'Uslovi korišćenja i izvor podataka portala Cene sa pijace - nezavisnog pijačnog barometra u Srbiji.',
  },
  en: {
    title: 'Disclaimer | Cene sa pijace',
    description: 'Terms of use and data sources for Cene sa pijace, an independent market price barometer in Serbia.',
  },
}

function productCopy(name, lang) {
  return lang === 'en'
    ? {
        title: `${name} - Current Price at Serbian Markets`,
        description: `Find out how much ${name} costs today at green market stalls. Compare the lowest and highest prices by city.`,
      }
    : {
        title: `${name} - Trenutna cena na pijacama u Srbiji`,
        description: `Saznajte koliko danas košta ${name} na pijačnim tezgama. Pogledajte najniže i najviše cene po gradovima.`,
      }
}

function marketCopy(market, city, lang) {
  return lang === 'en'
    ? {
        title: `${market} Market (${city}) - Current Price Overview`,
        description: `Fresh product prices at ${market} market in ${city}. Check the offer before you go shopping.`,
      }
    : {
        title: `Pijaca ${market} (${city}) - Pregled trenutnih cena`,
        description: `Sveže cene proizvoda na pijaci ${market} u gradu ${city}. Proverite ponudu pre odlaska u kupovinu.`,
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

    case 'market':
      return {
        ...marketCopy(entry.market, entry.city, entry.lang),
        lang: entry.lang,
        image: `${SITE_URL}/og/markets/${entry.slug}.png`,
        url,
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

function rewriteHtml(response, meta) {
  return new HTMLRewriter()
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
    .transform(response)
}

export async function onRequest(context) {
  const { request, next } = context
  const response = await next()

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const url = new URL(request.url)
  const meta = resolveMeta(url.pathname)
  return rewriteHtml(response, meta)
}
