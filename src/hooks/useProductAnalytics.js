import { useMemo } from 'react'
import { parseMesto } from '../utils/market.js'
import { productMatchesSlug, normalizeProductName, extractVariation } from '../utils/productId.js'
import { getRowLabel, getRowTime } from '../utils/week.js'
import { getAveragePrice as getComparablePrice } from '../utils/price.js'
import { resolveUnit } from '../utils/unit.js'
import { getSourceLabel } from '../utils/marketTime.js'

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

// Picks a single representative price for a city out of its markets' own
// CenaDom-preferring prices (see getComparablePrice) - the highest price any
// market in that city actually charges. Averaging (625 for Kvantaš at 500 +
// Skadarlija at 750) invented a figure no market ever charged; picking the
// mode broke just as badly the moment a city's markets didn't repeat a price
// (Kvantaš 500 / Kalenić 700 / Skadarlija 750, no two alike, tie-broke down
// to the lowest at 500) - it let Belgrade's true 750 RSD market get
// undercounted below cheaper cities like Leskovac at 600, which is never
// correct: a city's aggregate can't be lower than one of its own markets. A
// single-market city trivially returns that market's own price.
function highestMarketPrice(prices) {
  if (prices.length === 0) return null
  return Math.max(...prices)
}

// categoryName comes from the URL's :categorySlug segment and always
// applies (works even for a direct/bookmarked visit with no router state).
function matchesExactSlug(row, productSlug, categoryName) {
  if (!productMatchesSlug(row.Proizvod, productSlug)) return false
  if (categoryName && row.Kategorija !== categoryName) return false
  return true
}

export function useProductAnalytics(rows, productSlug, selectedGrad, categoryName, selectedPijaca, selectedVariation) {
  // Two passes: first, the exact clicked variant/slug (e.g. "Krompir
  // (beli)") purely to discover which product *family* this page is about;
  // then every row anywhere - any market, any city, any source - whose name
  // normalizes to that same base family (see normalizeProductName). STIPS
  // often splits one generic product into several named varieties
  // ("Krompir (beli)"/"Krompir (crveni)") while JKP never does (it's always
  // just "Krompir") - matching on the exact name alone left JKP's data (and
  // every STIPS sibling variety) invisible to a page opened from one
  // specific variety's card. This also drops the old Velicina/Pakovanje/
  // Poreklo attribute filter entirely: JKP rows never populate those fields
  // (see sheetsService.js's normalizeJkpRow), so requiring an exact match
  // silently excluded every JKP row from a STIPS-originated page (and vice
  // versa) even when the base name lined up.
  const exactRows = useMemo(
    () => rows.filter((row) => matchesExactSlug(row, productSlug, categoryName)),
    [rows, productSlug, categoryName],
  )

  const itemRows = useMemo(() => {
    if (exactRows.length === 0) return []
    const baseName = normalizeProductName(exactRows[0].Proizvod)
    return rows.filter((row) => {
      if (normalizeProductName(row.Proizvod) !== baseName) return false
      if (categoryName && row.Kategorija !== categoryName) return false
      return true
    })
  }, [rows, exactRows, categoryName])

  // Title/breadcrumb identity stays pinned to the exact variety that was
  // clicked (e.g. "Krompir (beli)", not whichever sibling variety happens
  // to be first in itemRows' broadened set) - only the aggregation widgets
  // below (history, cityComparison, marketComparison, currentMarket) widen
  // out to the whole product family.
  const identity = useMemo(() => {
    const row = exactRows[0]
    return {
      kategorija: row?.Kategorija ?? '',
      proizvod: (row?.Proizvod ?? '').trim(),
    }
  }, [exactRows])

  // Sub-variety tabs above the Price History Chart (see VariationSelector) -
  // first-seen order across itemRows so tab order stays stable between
  // renders. A row with no qualifier at all (e.g. JKP's plain "Krompir")
  // contributes no tab of its own - it's only ever visible under "all".
  const availableVariations = useMemo(() => {
    const seen = new Map()
    for (const row of itemRows) {
      const variation = extractVariation(row.Proizvod)
      if (variation && !seen.has(variation.key)) seen.set(variation.key, variation.label)
    }
    return Array.from(seen, ([key, label]) => ({ key, label }))
  }, [itemRows])

  // Only the Price History Chart narrows by variation (see
  // VariationSelector) - cityComparison/marketComparison/currentMarket stay
  // at the whole-family level regardless of which tab is selected.
  const historyRows = useMemo(() => {
    if (!selectedVariation || selectedVariation === 'all') return itemRows
    return itemRows.filter((row) => extractVariation(row.Proizvod)?.key === selectedVariation)
  }, [itemRows, selectedVariation])

  // Grouped by the row's own literal Source text (see scripts/jkp-scraper's
  // SOURCE_LABEL) rather than a hardcoded STIPS/JKP binary, so a future
  // third scraper with its own distinct Source string becomes its own
  // series automatically, with no change needed here - STIPS rows never
  // carry a Source at all, so they fall back to the generic "STIPS" bucket.
  const history = useMemo(() => {
    const byWeek = new Map()
    historyRows
      .filter((row) => parseMesto(row.Mesto).grad === selectedGrad)
      .forEach((row) => {
        const time = getRowTime(row)
        if (time === null) return
        if (!byWeek.has(time)) byWeek.set(time, { time, weekLabel: getRowLabel(row), bySource: new Map() })
        const bucket = byWeek.get(time)
        const source = row.Source || 'STIPS'
        if (!bucket.bySource.has(source)) bucket.bySource.set(source, [])
        bucket.bySource.get(source).push(row.CenaDom)
      })

    const sortedWeeks = Array.from(byWeek.values()).sort((a, b) => a.time - b.time)
    return sortedWeeks.map(({ time, weekLabel, bySource }) => ({
      time,
      weekLabel,
      ...Object.fromEntries(Array.from(bySource, ([source, prices]) => [source, average(prices)])),
    }))
  }, [historyRows, selectedGrad])

  // Stable series order (first-seen chronologically across `history` above)
  // so the chart's legend/series list and their assigned colors don't
  // reshuffle between renders - a product with only one source for the
  // selected city naturally ends up with a single-entry array here.
  const historySources = useMemo(() => {
    const sources = []
    for (const week of history) {
      for (const key of Object.keys(week)) {
        if (key !== 'time' && key !== 'weekLabel' && !sources.includes(key)) sources.push(key)
      }
    }
    return sources
  }, [history])

  // Each city's own latest record for this product, not a single global
  // latest timestamp - a city whose scraper ran even a day/week earlier than
  // the overall max would otherwise be silently dropped from the comparison
  // (see the STIPS/JKP note on useMarketExplorer.js for the same class of bug).
  const cityComparison = useMemo(() => {
    const byCity = new Map()
    itemRows.forEach((row) => {
      const time = getRowTime(row)
      if (time === null) return
      const { grad } = parseMesto(row.Mesto)
      const existing = byCity.get(grad)
      if (!existing || time > existing.time) {
        byCity.set(grad, { time, rows: [row] })
      } else if (time === existing.time) {
        existing.rows.push(row)
      }
    })
    return Array.from(byCity.entries())
      .map(([grad, { rows: cityRows }]) => ({
        grad,
        price: highestMarketPrice(cityRows.map(getComparablePrice).filter((price) => price !== null)),
      }))
      .filter((entry) => entry.price !== null)
      .sort((a, b) => a.price - b.price)
  }, [itemRows])

  // Same "each grouping's own latest record" convention as cityComparison
  // above, but grouped by market instead of city and pre-scoped to
  // selectedGrad - a market whose scraper ran even a day earlier than a
  // sibling market in the same city shouldn't be dropped from the comparison.
  const marketComparison = useMemo(() => {
    if (!selectedGrad) return []
    const byMarket = new Map()
    itemRows.forEach((row) => {
      const { grad, pijaca } = parseMesto(row.Mesto)
      if (grad !== selectedGrad) return
      const time = getRowTime(row)
      if (time === null) return
      const existing = byMarket.get(pijaca)
      if (!existing || time > existing.time) {
        byMarket.set(pijaca, { time, rows: [row] })
      } else if (time === existing.time) {
        existing.rows.push(row)
      }
    })
    return Array.from(byMarket.entries())
      .map(([pijaca, { rows: marketRows }]) => ({ pijaca, price: average(marketRows.map(getComparablePrice)) }))
      .filter((entry) => entry.price !== null)
      .sort((a, b) => a.price - b.price)
  }, [itemRows, selectedGrad])

  // The exact row(s) for the market currently being viewed - not every
  // market in the city (marketComparison) and not aggregated across markets
  // (cityComparison) - so the product header's own price/unit/source badge
  // always match whatever this page's breadcrumb/title already say the user
  // is looking at. sourceLabel mirrors ProductCard.jsx's own `row.Source ||
  // getSourceLabel(grad, pijaca)` exactly (the row's own attributed source
  // text - e.g. "JKP Beogradske pijace" - when present, falling back to
  // marketInfo.json's per-market institution name or the generic "STIPS"
  // only when the row carries neither) rather than a generic STIPS/JKP
  // category label, so both widgets always show the identical source string
  // for the same row.
  const currentMarket = useMemo(() => {
    if (!selectedGrad || !selectedPijaca) return null
    const matches = itemRows.filter((row) => {
      const parsed = parseMesto(row.Mesto)
      return parsed.grad === selectedGrad && parsed.pijaca === selectedPijaca
    })
    let latestTime = null
    for (const row of matches) {
      const time = getRowTime(row)
      if (time !== null && (latestTime === null || time > latestTime)) latestTime = time
    }
    if (latestTime === null) return null
    const latestRows = matches.filter((row) => getRowTime(row) === latestTime)
    const price = average(latestRows.map(getComparablePrice))
    if (price === null) return null
    return {
      price,
      unit: resolveUnit(latestRows[0].JedMere, latestRows[0].Kategorija),
      sourceLabel: latestRows[0].Source || getSourceLabel(selectedGrad, selectedPijaca),
    }
  }, [itemRows, selectedGrad, selectedPijaca])

  return {
    identity,
    availableVariations,
    history,
    historySources,
    cityComparison,
    cheapest: cityComparison[0] ?? null,
    priciest: cityComparison[cityComparison.length - 1] ?? null,
    marketComparison,
    currentMarket,
  }
}
