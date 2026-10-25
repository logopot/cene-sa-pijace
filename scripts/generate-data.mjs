// Pre-build step (see package.json's "prebuild") that turns the Google Sheet -
// still the single source of truth - into static files the site serves
// instead of letting every visitor's browser download the whole sheet:
//
//   public/data/latest.json            latest datapoints only (homepage, market
//                                      and city pages, filter options)
//   public/data/products/{family}.json full history of one product family,
//                                      lazy-loaded by the product page's chart
//   public/data/meta.json              data version + generation time
//   public/snap/**/*.html              per-route HTML snapshots injected by
//                                      functions/_middleware.js for crawlers
//
// Values are never altered: rows are only filtered (unpriced rows were
// already dropped client-side before), grouped and re-encoded. Unlike the SEO
// manifest step this one fails the build when the sheet can't be read -
// shipping a site with no data is worse than keeping the previous deploy.
//
// Run by hand any time with `npm run generate:data`; production refreshes go
// through the scrape workflow's deploy hook (see .github/workflows).
import { createHash } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseMesto, buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../src/utils/market.js'
import { getCategoryUrlSlug } from '../src/utils/categoryIcons.js'
import { getRowTime, getRowRangeLabel } from '../src/utils/week.js'
import { normalizeProductName } from '../src/utils/productId.js'
import { getAveragePrice } from '../src/utils/price.js'
import { translateDataValue, translateCategory, getProductUrlSlug, SUPPORTED_LANGUAGES } from './lib/productLabels.mjs'
import { fetchAllMarketRows, readLocalEnvFile, ROOT } from './lib/googleSheets.mjs'
import {
  LATEST_COLUMNS,
  HISTORY_COLUMNS,
  encodeRows,
  keepPricedRows,
  selectLatestRows,
  groupByFamily,
  getFamilySlug,
} from './lib/dataset.mjs'
import {
  tr,
  renderCard,
  renderHome,
  renderCity,
  renderMarket,
  renderCategory,
  renderProduct,
  latestRowsForMarket,
} from './lib/snapshot.mjs'

readLocalEnvFile()

const DATA_DIR = path.join(ROOT, 'public/data')
const SNAP_DIR = path.join(ROOT, 'public/snap')
const SNAPSHOT_PRODUCTS_PER_PAGE = 15
const HOME_DROPS = 8
const CURRENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function writeJson(relativePath, value) {
  const file = path.join(DATA_DIR, relativePath)
  mkdirSync(path.dirname(file), { recursive: true })
  const body = JSON.stringify(value)
  writeFileSync(file, body)
  return body.length
}

// "/" -> /snap/index.html, "/grad/beograd" -> /snap/grad/beograd.html
function writeSnapshot(routePath, html) {
  const relative = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}.html`
  const file = path.join(SNAP_DIR, relative)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, html)
}

function productPath(grad, pijaca, kategorija, proizvod, lang) {
  const categoryPath = buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(kategorija, lang), lang)
  return `${categoryPath}/${getProductUrlSlug(proizvod, lang)}`
}

// Deterministic counterpart of src/utils/weeklyDrops.js's tier 1 (the live
// page shuffles; a snapshot should be stable between builds): each product's
// latest price against the datapoint right before it, biggest relative drop
// first, only for products still being reported within the last week of the
// dataset's own timeline.
function pickHomeDrops(latestRows) {
  const buckets = new Map()
  let globalLatest = -Infinity
  for (const row of latestRows) {
    const time = getRowTime(row)
    if (time === null) continue
    globalLatest = Math.max(globalLatest, time)
    const key = `${row.Proizvod}|${row.Mesto}|${row.Source ?? ''}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push({ row, time })
  }

  const drops = []
  for (const entries of buckets.values()) {
    const times = Array.from(new Set(entries.map((entry) => entry.time))).sort((a, b) => b - a)
    if (times.length < 2 || globalLatest - times[0] > CURRENT_WINDOW_MS) continue
    const latest = entries.find((entry) => entry.time === times[0]).row
    const previous = entries.find((entry) => entry.time === times[1]).row
    const now = getAveragePrice(latest)
    const before = getAveragePrice(previous)
    if (now === null || before === null || before <= 0 || before - now <= 0) continue
    drops.push({ row: latest, ratio: (before - now) / before })
  }
  return drops.sort((a, b) => b.ratio - a.ratio).slice(0, HOME_DROPS).map((drop) => drop.row)
}

function getLastUpdatedLabel(lang, latestRows) {
  const newest = (rows) => {
    let best = null
    let bestTime = -Infinity
    for (const row of rows) {
      const time = getRowTime(row)
      if (time !== null && time > bestTime) {
        bestTime = time
        best = row
      }
    }
    return best ? getRowRangeLabel(best) : null
  }
  const stips = newest(latestRows.filter((row) => !row.Source))
  const jkp = newest(latestRows.filter((row) => row.Source))
  if (!stips && !jkp) return ''
  if (stips && jkp && stips !== jkp) return tr(lang, 'hero.lastUpdated.bySource', { stips, jkp })
  return tr(lang, 'hero.lastUpdated.combined', { value: stips ?? jkp })
}

function buildSnapshots(latestRows) {
  const cities = new Map()
  const markets = new Map()
  const marketCategories = new Map()
  const products = new Map()

  for (const row of latestRows) {
    const { grad, pijaca } = parseMesto(row.Mesto)
    if (!grad || !pijaca) continue
    cities.set(grad, grad)
    markets.set(`${grad}|${pijaca}`, { grad, pijaca })
    if (row.Kategorija && row.Proizvod) {
      marketCategories.set(`${grad}|${pijaca}|${row.Kategorija}`, { grad, pijaca, kategorija: row.Kategorija })
      products.set(`${grad}|${pijaca}|${row.Kategorija}|${row.Proizvod}`, {
        grad,
        pijaca,
        kategorija: row.Kategorija,
        proizvod: row.Proizvod,
      })
    }
  }

  let count = 0
  const emit = (routePath, html) => {
    writeSnapshot(routePath, html)
    count += 1
  }

  const homeLang = 'sr'
  const dropCards = pickHomeDrops(latestRows).map((row) => {
    const { grad, pijaca } = parseMesto(row.Mesto)
    return renderCard(row, homeLang, productPath(grad, pijaca, row.Kategorija, row.Proizvod, homeLang))
  })
  const cityLinks = Array.from(cities.values())
    .sort((a, b) => a.localeCompare(b))
    .map((grad) => ({ href: buildCityRoute(grad, homeLang), label: translateDataValue(homeLang, 'grad', grad) }))
  emit('/', renderHome({ lang: homeLang, drops: dropCards, cityLinks, lastUpdated: getLastUpdatedLabel(homeLang, latestRows) }))

  // Per product family: every market's own latest rows for it, cheapest
  // first. Computed once per family instead of once per product page.
  const familyLatest = groupByFamily(latestRows)
  const familyCache = new Map()
  const familyMarketRows = (base) => {
    if (familyCache.has(base)) return familyCache.get(base)
    const family = (familyLatest.get(getFamilySlug(base)) ?? []).filter((row) => normalizeProductName(row.Proizvod) === base)
    const seen = new Set()
    const rows = []
    for (const row of family) {
      const parsed = parseMesto(row.Mesto)
      const key = `${parsed.grad}|${parsed.pijaca}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push(...latestRowsForMarket(family, parsed.grad, parsed.pijaca))
    }
    rows.sort((a, b) => (getAveragePrice(a) ?? Infinity) - (getAveragePrice(b) ?? Infinity))
    familyCache.set(base, rows)
    return rows
  }

  for (const lang of SUPPORTED_LANGUAGES) {
    for (const grad of cities.values()) {
      const marketLinks = Array.from(markets.values())
        .filter((market) => market.grad === grad)
        .sort((a, b) => a.pijaca.localeCompare(b.pijaca))
        .map(({ pijaca }) => ({
          href: buildMarketRoute(grad, pijaca, lang),
          label: translateDataValue(lang, 'pijaca', pijaca),
        }))
      emit(buildCityRoute(grad, lang), renderCity({ lang, city: translateDataValue(lang, 'grad', grad), marketLinks }))
    }

    for (const { grad, pijaca } of markets.values()) {
      const rows = latestRowsForMarket(latestRows, grad, pijaca)
      const cards = rows.map((row) =>
        renderCard(row, lang, productPath(grad, pijaca, row.Kategorija, row.Proizvod, lang), { compact: true }),
      )
      emit(
        buildMarketRoute(grad, pijaca, lang),
        renderMarket({
          lang,
          market: translateDataValue(lang, 'pijaca', pijaca),
          city: translateDataValue(lang, 'grad', grad),
          cards,
        }),
      )
    }

    for (const { grad, pijaca, kategorija } of marketCategories.values()) {
      const rows = latestRowsForMarket(latestRows, grad, pijaca).filter((row) => row.Kategorija === kategorija)
      const cards = rows.map((row) =>
        renderCard(row, lang, productPath(grad, pijaca, row.Kategorija, row.Proizvod, lang), { compact: true }),
      )
      const categoryPath = buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(kategorija, lang), lang)
      emit(
        categoryPath,
        renderCategory({
          lang,
          category: translateCategory(lang, kategorija),
          market: translateDataValue(lang, 'pijaca', pijaca),
          city: translateDataValue(lang, 'grad', grad),
          cards,
        }),
      )
    }

    for (const { grad, pijaca, kategorija, proizvod } of products.values()) {
      const base = normalizeProductName(proizvod)
      const ownKey = `${grad}|${pijaca}`

      // This market's own row(s) for the exact product first, then the same
      // product family at the cheapest other markets (each at its own latest
      // time), as compact lines to keep the snapshot payload small.
      const here = latestRowsForMarket(latestRows, grad, pijaca).filter((row) => row.Proizvod === proizvod)
      const cards = familyMarketRows(base)
        .filter((row) => {
          const parsed = parseMesto(row.Mesto)
          return `${parsed.grad}|${parsed.pijaca}` !== ownKey
        })
        .slice(0, SNAPSHOT_PRODUCTS_PER_PAGE)
        .map((row) => {
          const parsed = parseMesto(row.Mesto)
          return renderCard(row, lang, productPath(parsed.grad, parsed.pijaca, row.Kategorija, row.Proizvod, lang), {
            compact: true,
          })
        })

      emit(
        productPath(grad, pijaca, kategorija, proizvod, lang),
        renderProduct({
          lang,
          product: translateDataValue(lang, 'proizvod', proizvod),
          current: here[0] ? renderCard(here[0], lang, null, { compact: true }) : '',
          cards,
        }),
      )
    }
  }

  return count
}

async function main() {
  const allRows = keepPricedRows(await fetchAllMarketRows())
  if (allRows.length === 0) throw new Error('Sheet returned no priced rows - refusing to publish an empty dataset')

  rmSync(DATA_DIR, { recursive: true, force: true })
  rmSync(SNAP_DIR, { recursive: true, force: true })

  const latestRows = selectLatestRows(allRows)
  const latestPayload = encodeRows(latestRows, LATEST_COLUMNS)
  const version = createHash('sha1').update(JSON.stringify(latestPayload)).digest('hex').slice(0, 10)
  const generatedAt = new Date().toISOString()

  const latestBytes = writeJson('latest.json', { version, generatedAt, ...latestPayload })

  const families = groupByFamily(allRows)
  let largestFamily = { slug: '', bytes: 0 }
  for (const [slug, rows] of families) {
    const bytes = writeJson(`products/${slug}.json`, { version, ...encodeRows(rows, HISTORY_COLUMNS) })
    if (bytes > largestFamily.bytes) largestFamily = { slug, bytes }
  }

  writeJson('meta.json', {
    version,
    generatedAt,
    sourceRows: allRows.length,
    latestRows: latestRows.length,
    productFamilies: families.size,
  })

  const snapshots = buildSnapshots(latestRows)

  console.log(
    `[generate-data] ${allRows.length} source rows -> latest.json ${latestRows.length} rows (${(latestBytes / 1024).toFixed(0)} KB raw), ` +
      `${families.size} product files (largest ${largestFamily.slug} ${(largestFamily.bytes / 1024).toFixed(0)} KB), ${snapshots} HTML snapshots, version ${version}`,
  )
}

main().catch((error) => {
  console.error('[generate-data] failed:', error.message)
  process.exit(1)
})
