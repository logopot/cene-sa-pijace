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

function buildManifest(rows) {
  const entries = buildStaticEntries()

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
      entries[buildCityRoute(grad, lang)] = {
        type: 'city',
        lang,
        city: translateDataValue(lang, 'grad', grad),
        slug: getCanonicalCitySlug(grad),
      }
    }

    for (const { grad, pijaca } of markets.values()) {
      const marketPath = buildMarketRoute(grad, pijaca, lang)
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
      entries[productPath] = {
        type: 'product',
        lang,
        name: translateDataValue(lang, 'proizvod', proizvod),
        slug: getCanonicalProductSlug(proizvod),
      }
    }
  }

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
