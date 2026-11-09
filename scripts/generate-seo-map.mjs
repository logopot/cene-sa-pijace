// Pre-build step (see package.json's "prebuild" script) that turns the live
// price sheet into a flat { path -> metadata } manifest. The Cloudflare Pages
// middleware (functions/_middleware.js) imports the generated file and does
// a plain object lookup per request - no network/database calls happen on
// the request path, only here at build time.
import { parseMesto, buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../src/utils/market.js'
import { getCategoryUrlSlug } from '../src/utils/categoryIcons.js'
import { DISCLAIMER_PATH } from '../src/constants/routeLocales.js'
import {
  translateDataValue,
  translateCategory,
  getProductUrlSlug,
  getCanonicalProductSlug,
  getCanonicalMarketSlug,
  getCanonicalCitySlug,
  SUPPORTED_LANGUAGES,
} from './lib/productLabels.mjs'
import { fetchAllMarketRows, readLocalEnvFile, ROOT } from './lib/googleSheets.mjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

readLocalEnvFile()

const OUTPUT_PATH = path.join(ROOT, 'functions/lib/seo-manifest.mjs')
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml')
const SITE_URL = 'https://cenesapijace.org'

function buildStaticEntries() {
  const entries = {}
  entries['/'] = { type: 'home' }
  for (const lang of SUPPORTED_LANGUAGES) {
    entries[DISCLAIMER_PATH[lang]] = { type: 'disclaimer', lang }
  }
  return entries
}

// Pairs every route with its other-language versions (hreflang). `groups` maps
// a language-independent page identity to { lang -> path }; a page only gets
// `alt` ({ otherLang -> path }) when every other language really has an entry
// in the manifest and that entry points straight back, so the links are always
// reciprocal and never guessed. A route whose canonical is a different path
// (a single-category market's category page) is skipped: hreflang belongs on
// the canonical URL only.
function attachAlternates(entries, groups) {
  let linked = 0
  let dropped = 0
  const owners = new Map()
  for (const byLang of groups.values()) {
    for (const routePath of Object.values(byLang)) owners.set(routePath, (owners.get(routePath) ?? 0) + 1)
  }
  for (const byLang of groups.values()) {
    const langs = Object.keys(byLang)
    const complete = SUPPORTED_LANGUAGES.every((lang) => {
      const routePath = byLang[lang]
      const entry = routePath && entries[routePath]
      return entry && entry.lang === lang && (!entry.canonicalPath || entry.canonicalPath === routePath)
    })
    // Two sheet rows can collapse onto one URL (same translated product slug);
    // then the path no longer identifies a single page and is left unlinked.
    const unique = Object.values(byLang).every((routePath) => owners.get(routePath) === 1)
    if (!complete || !unique || langs.length !== SUPPORTED_LANGUAGES.length) {
      dropped += langs.length
      continue
    }
    for (const lang of langs) {
      entries[byLang[lang]].alt = Object.fromEntries(langs.filter((other) => other !== lang).map((other) => [other, byLang[other]]))
      linked += 1
    }
  }
  return { linked, dropped }
}

function buildManifest(rows) {
  const entries = buildStaticEntries()
  const groups = new Map()
  const addToGroup = (key, lang, routePath) => {
    if (!groups.has(key)) groups.set(key, {})
    groups.get(key)[lang] = routePath
  }
  addToGroup('disclaimer', 'sr', DISCLAIMER_PATH.sr)
  addToGroup('disclaimer', 'en', DISCLAIMER_PATH.en)

  // Keyed so repeat rows (every week's price snapshot re-lists the same
  // market/product) collapse to one manifest entry each.
  const cities = new Map()
  const markets = new Map()
  const marketCategories = new Map()
  const products = new Map()
  // grad|pijaca -> Set of distinct Kategorija values, used below to detect a
  // market whose entire catalog is one category (see MarketCategoryDetails's
  // useMarketCategoryCount) - its /:categorySlug route lists the exact same
  // products as its /:marketSlug route, so that category entry canonicalizes
  // onto the market page instead of getting its own manifest identity.
  const categoriesByMarket = new Map()

  for (const row of rows) {
    const { grad, pijaca } = parseMesto(row.Mesto)
    if (!grad || !pijaca) continue

    cities.set(grad, grad)
    markets.set(`${grad}|${pijaca}`, { grad, pijaca })

    if (row.Kategorija && row.Proizvod) {
      const marketKey = `${grad}|${pijaca}`
      marketCategories.set(`${marketKey}|${row.Kategorija}`, { grad, pijaca, kategorija: row.Kategorija })
      if (!categoriesByMarket.has(marketKey)) categoriesByMarket.set(marketKey, new Set())
      categoriesByMarket.get(marketKey).add(row.Kategorija)

      products.set(`${grad}|${pijaca}|${row.Kategorija}|${row.Proizvod}`, {
        grad,
        pijaca,
        kategorija: row.Kategorija,
        proizvod: row.Proizvod,
      })
    }
  }

  for (const lang of SUPPORTED_LANGUAGES) {
    for (const grad of cities.values()) {
      addToGroup(`city|${grad}`, lang, buildCityRoute(grad, lang))
      entries[buildCityRoute(grad, lang)] = {
        type: 'city',
        lang,
        city: translateDataValue(lang, 'grad', grad),
        slug: getCanonicalCitySlug(grad),
      }
    }

    for (const { grad, pijaca } of markets.values()) {
      const marketPath = buildMarketRoute(grad, pijaca, lang)
      addToGroup(`market|${grad}|${pijaca}`, lang, marketPath)
      entries[marketPath] = {
        type: 'market',
        lang,
        market: translateDataValue(lang, 'pijaca', pijaca),
        city: translateDataValue(lang, 'grad', grad),
        slug: getCanonicalMarketSlug(grad, pijaca),
      }
    }

    for (const { grad, pijaca, kategorija } of marketCategories.values()) {
      const marketPath = buildMarketRoute(grad, pijaca, lang)
      const categoryUrlSlug = getCategoryUrlSlug(kategorija, lang)
      const categoryPath = buildMarketCategoryRoute(grad, pijaca, categoryUrlSlug, lang)
      const isOnlyCategory = categoriesByMarket.get(`${grad}|${pijaca}`)?.size === 1
      addToGroup(`category|${grad}|${pijaca}|${kategorija}`, lang, categoryPath)
      entries[categoryPath] = {
        type: 'category',
        lang,
        category: translateCategory(lang, kategorija),
        market: translateDataValue(lang, 'pijaca', pijaca),
        city: translateDataValue(lang, 'grad', grad),
        slug: getCanonicalMarketSlug(grad, pijaca),
        canonicalPath: isOnlyCategory ? marketPath : categoryPath,
      }
    }

    for (const { grad, pijaca, kategorija, proizvod } of products.values()) {
      const categoryUrlSlug = getCategoryUrlSlug(kategorija, lang)
      const marketPath = buildMarketCategoryRoute(grad, pijaca, categoryUrlSlug, lang)
      const productPath = `${marketPath}/${getProductUrlSlug(proizvod, lang)}`
      addToGroup(`product|${grad}|${pijaca}|${kategorija}|${proizvod}`, lang, productPath)
      entries[productPath] = {
        type: 'product',
        lang,
        name: translateDataValue(lang, 'proizvod', proizvod),
        slug: getCanonicalProductSlug(proizvod),
      }
    }
  }

  const { linked, dropped } = attachAlternates(entries, groups)
  console.log(`[generate-seo-map] hreflang: ${linked} routes linked sr<->en, ${dropped} left without alternates`)

  return entries
}

// Every indexable route in the manifest. A category page that canonicalizes
// onto its market page (a market with a single category) is left out, so the
// sitemap only lists URLs that are their own canonical.
function buildSitemap(entries) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = Object.entries(entries)
    .filter(([routePath, entry]) => !entry.canonicalPath || entry.canonicalPath === routePath)
    .map(([routePath, entry]) => {
      const priority = entry.type === 'home' ? '1.0' : entry.type === 'disclaimer' ? '0.2' : '0.6'
      return `  <url><loc>${SITE_URL}${routePath}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
    })
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

async function main() {
  let entries
  try {
    const rows = await fetchAllMarketRows()
    if (rows.length === 0) throw new Error('sheet returned no rows')
    entries = buildManifest(rows)
    console.log(`[generate-seo-map] built ${Object.keys(entries).length} route entries from ${rows.length} rows`)
  } catch (error) {
    // Fail the build rather than publish a static-only manifest and a
    // 3-URL sitemap: the previous deployment, which has the full ones, stays
    // live until the next build succeeds.
    console.error('[generate-seo-map] could not read the sheet, failing the build:', error.message)
    process.exit(1)
  }

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  const body = `// Auto-generated by scripts/generate-seo-map.mjs - do not edit by hand.\nexport const SEO_MANIFEST = ${JSON.stringify(entries)}\n`
  writeFileSync(OUTPUT_PATH, body)
  console.log(`[generate-seo-map] wrote ${OUTPUT_PATH}`)

  writeFileSync(SITEMAP_PATH, buildSitemap(entries))
  console.log(`[generate-seo-map] wrote ${SITEMAP_PATH}`)
}

main()
