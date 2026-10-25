// Pure data-shaping helpers behind scripts/generate-data.mjs - no file or
// network access in here, so they can be reasoned about (and tested) in
// isolation. The source of truth stays the Google Sheet: nothing below
// invents, estimates or alters a price - rows are only filtered, grouped and
// re-encoded into a compact column-array wire format.
import { getRowTime } from '../../src/utils/week.js'
import { hasAnyPrice } from '../../src/utils/price.js'
import { slugify, normalizeProductName } from '../../src/utils/productId.js'

// Wire format: { columns: [...], rows: [[...], ...] } - column names are
// written once instead of once per row, which is most of the size win on top
// of only shipping the latest datapoints. Columns the UI never reads
// (Godina, Nedelja, RBr, ScrapedAt) are intentionally left out.
export const LATEST_COLUMNS = [
  'Date',
  'NedeljaOpis',
  'Kategorija',
  'Mesto',
  'Proizvod',
  'Velicina',
  'Pakovanje',
  'Poreklo',
  'JedMere',
  'CenaMin',
  'CenaMax',
  'CenaDom',
  'Trend',
  'Ponuda',
  'Komentar',
  'Source',
]

// The price-history chart and the comparison widgets only need identity,
// time, unit and price fields - the descriptive card attributes (packaging,
// origin, offer...) are only shown from the latest rows.
export const HISTORY_COLUMNS = [
  'Date',
  'NedeljaOpis',
  'Kategorija',
  'Mesto',
  'Proizvod',
  'JedMere',
  'CenaMin',
  'CenaMax',
  'CenaDom',
  'Source',
]

export function encodeRows(rows, columns) {
  return {
    columns,
    rows: rows.map((row) => columns.map((column) => (row[column] === undefined ? '' : row[column]))),
  }
}

// Same filter useMarketPrices used to apply in the browser: a source record
// with no usable price in any field renders nothing anywhere in the UI.
export function keepPricedRows(rows) {
  return rows.filter(hasAnyPrice)
}

// One bucket per product *at one market from one source*; within a bucket
// only the two most recent distinct reporting times survive. Two is what the
// homepage's "biggest drops" needs (latest vs. the datapoint right before
// it, see src/utils/weeklyDrops.js) and everything else on the market/city
// pages only reads the latest. All rows sharing a surviving time are kept,
// since one product can legitimately have several rows per report (e.g.
// different origin/packaging).
export function selectLatestRows(rows) {
  const buckets = new Map()
  for (const row of rows) {
    const time = getRowTime(row)
    if (time === null) continue
    const key = `${row.Proizvod}|${row.Mesto}|${row.Source ?? ''}`
    if (!buckets.has(key)) buckets.set(key, new Map())
    const byTime = buckets.get(key)
    if (!byTime.has(time)) byTime.set(time, [])
    byTime.get(time).push(row)
  }

  const latest = []
  for (const byTime of buckets.values()) {
    const times = Array.from(byTime.keys()).sort((a, b) => b - a).slice(0, 2)
    for (const time of times) latest.push(...byTime.get(time))
  }
  return latest
}

// File key of a product *family* ("Krompir (beli)" and "Krompir (crveni)"
// are both family "krompir") - the same grouping src/hooks/useProductAnalytics.js
// widens to for its history/comparison widgets.
export function getFamilySlug(proizvod) {
  return slugify(normalizeProductName(proizvod))
}

export function groupByFamily(rows) {
  const families = new Map()
  for (const row of rows) {
    const slug = getFamilySlug(row.Proizvod)
    if (!slug) continue
    if (!families.has(slug)) families.set(slug, [])
    families.get(slug).push(row)
  }
  return families
}
