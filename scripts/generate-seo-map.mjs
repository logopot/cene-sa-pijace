// Pre-build step (see package.json's "prebuild" script) that turns the live
// price sheet into a flat { path -> metadata } manifest. The Cloudflare Pages
// middleware (functions/_middleware.js) imports the generated file and does
// a plain object lookup per request - no network/database calls happen on
// the request path, only here at build time.
import { parseMesto, buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../src/utils/market.js'
import { getCategoryUrlSlug } from '../src/utils/categoryIcons.js'
import { DISCLAIMER_PATH, FEEDBACK_PATH } from '../src/constants/routeLocales.js'
import { pathToFileURL } from 'node:url'
import {
  translateDataValue,
  translateCategory,
  getProductUrlSlug,
  getCanonicalProductSlug,
  getCanonicalMarketSlug,
  getCanonicalCitySlug,
  SUPPORTED_LANGUAGES,
} from './lib/productLabels.mjs'
import { fetchAllMarketRows, readLocalEnvFile, ROOT, readJsonFile } from './lib/googleSheets.mjs'
import { keepPricedRows, selectLatestRows } from './lib/dataset.mjs'
import { latestRowsForMarket, rowsForMarket, listingFacts, productFacts, productVariant } from '../src/utils/seoFacts.js'
import { manifestEntryCopy, isKvantaskaMarket } from '../src/utils/seoCopy.js'
import { untranslatedProductNames } from '../src/utils/productNames.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

readLocalEnvFile()

const OUTPUT_PATH = path.join(ROOT, 'functions/lib/seo-manifest.mjs')
const SITEMAP_PATH = path.join(ROOT, 'public/sitemap.xml')
const SITE_URL = 'https://cenesapijace.org'
const MARKET_INFO = readJsonFile('src/data/marketInfo.json')

// Safety valve for the "no prices" noindex rule: if it would hit more than this
// share of the sitemap's routes, something is wrong with the data (a failed
// scrape, a half-empty sheet) rather than with a few pages - so nothing is
// marked and the build says so loudly instead of de-indexing the site.
const NOINDEX_MAX_SHARE = 0.05

// Is this route its own canonical (what the sitemap lists)? A category page
// that collapses onto its market page is not.
const isOwnCanonical = (routePath, entry) => !entry.canonicalPath || entry.canonicalPath === routePath

export function buildStaticEntries() {
  const entries = {}
  entries['/'] = { type: 'home' }
  for (const lang of SUPPORTED_LANGUAGES) {
    entries[DISCLAIMER_PATH[lang]] = { type: 'disclaimer', lang }
    // The suggestions form: a known route (200, real page) but noindex, so it
    // is kept out of sitemap.xml, and never part of a hreflang group.
    entries[FEEDBACK_PATH[lang]] = { type: 'feedback', lang, noindex: 1 }
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

// Titles and descriptions of product pages must be unique within a language.
// The base copy already carries product, market and city; pages that still share
// all three (one name under two categories, two sheet names with one translation)
// get a variant in parentheses - see productVariant in src/utils/seoFacts.js, the
// same rule the React pages apply. This reports uniqueness before and after the
// variants and lists whatever still collides.
function reportCopyUniqueness(entries) {
  const measure = (paths, withVariants) => {
    const titles = new Map()
    const descriptions = new Map()
    for (const routePath of paths) {
      const entry = withVariants ? entries[routePath] : { ...entries[routePath], vr: undefined }
      const copy = manifestEntryCopy(entry)
      titles.set(copy.title, [...(titles.get(copy.title) ?? []), routePath])
      descriptions.set(copy.description, [...(descriptions.get(copy.description) ?? []), routePath])
    }
    return { pages: paths.length, titles: titles.size, descriptions: descriptions.size, clashing: [...titles.values(), ...descriptions.values()].filter((list) => list.length > 1) }
  }
  for (const lang of SUPPORTED_LANGUAGES) {
    const paths = Object.keys(entries).filter((p) => entries[p].type === 'product' && entries[p].lang === lang)
    const base = measure(paths, false)
    const final = measure(paths, true)
    console.log(`[generate-seo-map] product copy ${lang}: ${base.pages} pages, unique titles/descriptions ${base.titles}/${base.descriptions} before variants, ${final.titles}/${final.descriptions} after (${paths.filter((p) => entries[p].vr).length} variants)`)
    for (const list of final.clashing.slice(0, 5)) console.warn(`[generate-seo-map]   STILL DUPLICATE: ${list.slice(0, 3).join(' | ')}`)
  }
}

// A product route with no priced row at its market (not even an older one - the
// app has nothing to show for it) renders nothing but the "Ova tezga je
// trenutno prazna" state: it stays in the manifest and answers 200
// (so it comes back by itself once data returns) but is kept out of search -
// noindex in the HTML and absent from sitemap.xml. A sr route and its en twin
// are decided by the same condition (no priced row), so a pair always agrees.
function markPricelessRoutes(entries) {
  const priceless = Object.entries(entries).filter(([, entry]) => entry.type === 'product' && !entry.pr)
  const listed = Object.entries(entries).filter(([routePath, entry]) => isOwnCanonical(routePath, entry)).length
  const share = priceless.length / listed
  const examples = priceless.filter(([, entry]) => entry.lang === 'sr').slice(0, 10).map(([routePath]) => routePath)
  if (share > NOINDEX_MAX_SHARE) {
    console.error(
      `[generate-seo-map] NOINDEX NOT APPLIED: ${priceless.length} of ${listed} routes (${(share * 100).toFixed(1)}%) have no price, over the ${NOINDEX_MAX_SHARE * 100}% limit. Examples:\n  ${examples.join('\n  ')}`,
    )
    return
  }
  for (const [, entry] of priceless) entry.noindex = 1
  console.log(`[generate-seo-map] noindex (no price rows): ${priceless.length} of ${listed} routes (${(share * 100).toFixed(2)}%)`)
  for (const example of examples) console.log('[generate-seo-map]   noindex example:', example)
}

function buildManifest(rows) {
  const entries = buildStaticEntries()
  // The same latest priced rows the page snapshots and the app's latest.json
  // are made of (see generate-data.mjs), indexed by market once.
  const latestRows = selectLatestRows(keepPricedRows(rows))
  const marketLatest = new Map()
  const marketAll = new Map()
  const allFor = (grad, pijaca) => {
    const key = `${grad}|${pijaca}`
    if (!marketAll.has(key)) marketAll.set(key, rowsForMarket(latestRows, grad, pijaca))
    return marketAll.get(key)
  }
  const latestFor = (grad, pijaca) => {
    const key = `${grad}|${pijaca}`
    if (!marketLatest.has(key)) marketLatest.set(key, latestRowsForMarket(latestRows, grad, pijaca))
    return marketLatest.get(key)
  }
  const sourceLabelFor = (grad, pijaca) => MARKET_INFO[`${grad}|${pijaca}`]?.sourceLabel ?? 'STIPS'
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
      if (isKvantaskaMarket(lang, entries[marketPath].market)) {
        const { source, date } = listingFacts(latestFor(grad, pijaca))
        Object.assign(entries[marketPath], { sr: source, dt: date })
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
      if (isKvantaskaMarket(lang, entries[categoryPath].market)) {
        const { source, date } = listingFacts(latestFor(grad, pijaca).filter((row) => row.Kategorija === kategorija))
        Object.assign(entries[categoryPath], { sr: source, dt: date })
      }
    }

    for (const { grad, pijaca, kategorija, proizvod } of products.values()) {
      const categoryUrlSlug = getCategoryUrlSlug(kategorija, lang)
      const marketPath = buildMarketCategoryRoute(grad, pijaca, categoryUrlSlug, lang)
      const productPath = `${marketPath}/${getProductUrlSlug(proizvod, lang)}`
      addToGroup(`product|${grad}|${pijaca}|${kategorija}|${proizvod}`, lang, productPath)
      // Facts of this product's own latest row at this market; null when the
      // market has no priced row for it (see markPricelessRoutes).
      const facts = productFacts(
        allFor(grad, pijaca),
        (row) => row.Proizvod === proizvod && row.Kategorija === kategorija,
        sourceLabelFor(grad, pijaca),
      )
      const variant = productVariant(
        allFor(grad, pijaca),
        { proizvod, kategorija },
        (raw) => translateDataValue(lang, 'proizvod', raw),
        (category) => translateCategory(lang, category),
      )
      entries[productPath] = {
        type: 'product',
        lang,
        name: translateDataValue(lang, 'proizvod', proizvod),
        slug: getCanonicalProductSlug(proizvod),
        mk: translateDataValue(lang, 'pijaca', pijaca),
        ct: translateDataValue(lang, 'grad', grad),
        cg: translateCategory(lang, kategorija),
        ...(facts && {
          pr: [facts.min, facts.max],
          ...(facts.unitRaw && { un: translateDataValue(lang, 'jedMere', facts.unitRaw) }),
          sr: facts.source,
          dt: facts.date,
        }),
        ...(variant && { vr: variant }),
      }
    }
  }

  const untranslated = untranslatedProductNames(rows.map((row) => row.Proizvod).filter(Boolean))
  if (untranslated.length > 0) {
    console.warn(
      `[generate-seo-map] WARNING: ${untranslated.length} product name(s) have no English translation in src/data/productNamesEn.js (the Serbian name is shown on English pages):\n  - ${untranslated.join('\n  - ')}`,
    )
  } else {
    console.log('[generate-seo-map] every product name has an English translation')
  }
  reportCopyUniqueness(entries)
  markPricelessRoutes(entries)

  const { linked, dropped } = attachAlternates(entries, groups)
  console.log(`[generate-seo-map] hreflang: ${linked} routes linked sr<->en, ${dropped} left without alternates`)

  return entries
}

// Every indexable route in the manifest. A category page that canonicalizes
// onto its market page (a market with a single category) is left out, so the
// sitemap only lists URLs that are their own canonical.
export function buildSitemap(entries) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = Object.entries(entries)
    .filter(([routePath, entry]) => isOwnCanonical(routePath, entry) && !entry.noindex)
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

// Only when run as a script (the tests import the helpers above).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
