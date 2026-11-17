import { parseMesto } from './market.js'
import { getRowTime, getRowRangeLabel } from './week.js'
import { getDisplayPrice } from './price.js'
import { resolveUnit } from './unit.js'
import { isFreshRow, lastPriceLabel } from '../data/freshness.js'

// The facts the page-specific title/description copy (see seoCopy.js) is built
// from, read from the same latest rows the page itself renders - shared by the
// build (scripts/generate-seo-map.mjs) and the React pages, so the text the
// server sends and the text the app sets after hydration come from one rule.

// A market's rows at that market's own latest reporting time - what its page
// lists (see MarketDetails's useMarketData and scripts/lib/snapshot.mjs).
export function latestRowsForMarket(rows, grad, pijaca) {
  const marketRows = rows.filter((row) => {
    const parsed = parseMesto(row.Mesto)
    return parsed.grad === grad && parsed.pijaca === pijaca
  })
  let latest = null
  for (const row of marketRows) {
    const time = getRowTime(row)
    if (time !== null && (latest === null || time > latest)) latest = time
  }
  return latest === null ? [] : marketRows.filter((row) => getRowTime(row) === latest)
}

// Source badge + date of a market/category page, exactly as WeekStatus shows
// them (row.Source is only ever set on JKP rows). Empty when the page lists
// nothing.
export function listingFacts(rows) {
  const first = rows[0]
  if (!first) return { source: '', date: '' }
  return { source: first.Source ? 'JKP' : 'STIPS', date: getRowRangeLabel(first) }
}

// Every row of one market (any reporting time).
export function rowsForMarket(rows, grad, pijaca) {
  return rows.filter((row) => {
    const parsed = parseMesto(row.Mesto)
    return parsed.grad === grad && parsed.pijaca === pijaca
  })
}

// The product's own most recent priced row at its market - the price the
// product page shows for that market (see useProductAnalytics's currentMarket;
// a product can be reported on a different week than the rest of its market).
// `matches(row)` picks the product's rows out of the market's rows;
// `fallbackSource` is the market's attributed source for rows that carry none.
// Returns null when the market has no priced row for the product at all.
// `reference` (see data/freshness.js) is what decides `stale`; without it nothing is
// stale. A stale product's `lastDate` is the date of that record ("24.09.2026.").
export function productFacts(marketRows, matches, fallbackSource, reference) {
  let row = null
  let rowTime = null
  for (const candidate of marketRows) {
    if (!matches(candidate) || !getDisplayPrice(candidate)) continue
    const time = getRowTime(candidate)
    if (time !== null && (rowTime === null || time > rowTime)) {
      row = candidate
      rowTime = time
    }
  }
  if (!row) return null
  const price = getDisplayPrice(row)
  return {
    min: price.type === 'range' ? price.min : price.value,
    max: price.type === 'range' ? price.max : price.value,
    unitRaw: resolveUnit(row.JedMere, row.Kategorija),
    source: row.Source || fallbackSource,
    date: getRowRangeLabel(row),
    stale: reference ? !isFreshRow(row, reference) : false,
    lastDate: lastPriceLabel(row),
  }
}

// What tells a product page apart from another page of the same market whose
// title would otherwise read the same: the same name filed under two categories
// ("Paprika (babura)" under Povrće and Voće), or two sheet names with one
// translation. Decided from the market's own rows only, so the build and the
// browser reach the same answer without knowing about each other's pages.
// Returns '' when the page needs no variant.
export function productVariant(marketRows, own, displayName, categoryLabel) {
  const name = displayName(own.proizvod)
  const sameName = new Map()
  for (const row of marketRows) {
    if (!row.Proizvod || !row.Kategorija) continue
    if (row.Proizvod === own.proizvod && row.Kategorija === own.kategorija) continue
    if (displayName(row.Proizvod) === name) sameName.set(`${row.Kategorija}|${row.Proizvod}`, row)
  }
  if (sameName.size === 0) return ''
  const siblings = Array.from(sameName.values())
  const otherSpelling = siblings.some((row) => row.Proizvod !== own.proizvod)
  const otherCategory = siblings.some((row) => row.Kategorija !== own.kategorija)
  const category = categoryLabel(own.kategorija)
  if (otherSpelling && otherCategory) return `${category}, ${own.proizvod}`
  return otherSpelling ? own.proizvod : category
}
