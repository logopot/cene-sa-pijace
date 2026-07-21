import { useMemo } from 'react'
import { parseMesto } from '../utils/market.js'
import { productMatchesSlug } from '../utils/productId.js'
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

// categoryName comes from the URL's :categorySlug segment and always applies
// (works even for a direct/bookmarked visit with no router state). filters
// disambiguates products whose names still collide within that category (see
// buildProductRoute) - it travels via router state from the card that
// triggered navigation, so it's only available for in-app navigation.
function matchesIdentity(row, productSlug, categoryName, filters) {
  if (!productMatchesSlug(row.Proizvod, productSlug)) return false
  if (categoryName && row.Kategorija !== categoryName) return false
  if (!filters) return true
  return (
    row.Velicina === filters.velicina &&
    row.Pakovanje === filters.pakovanje &&
    row.Poreklo === filters.poreklo
  )
}

export function useProductAnalytics(rows, productSlug, filters, selectedGrad, categoryName, selectedPijaca) {
  const itemRows = useMemo(
    () => rows.filter((row) => matchesIdentity(row, productSlug, categoryName, filters)),
    [rows, productSlug, categoryName, filters],
  )

  const identity = useMemo(() => {
    const row = itemRows[0]
    return {
      kategorija: row?.Kategorija ?? '',
      proizvod: (row?.Proizvod ?? '').trim(),
      velicina: row?.Velicina ?? '',
      pakovanje: row?.Pakovanje ?? '',
      poreklo: row?.Poreklo ?? '',
    }
  }, [itemRows])

  const history = useMemo(() => {
    const byWeek = new Map()
    itemRows
      .filter((row) => parseMesto(row.Mesto).grad === selectedGrad)
      .forEach((row) => {
        const time = getRowTime(row)
        if (time === null) return
        if (!byWeek.has(time))
          byWeek.set(time, { time, weekLabel: getRowLabel(row), stipsPrices: [], jkpPrices: [] })
        const bucket = byWeek.get(time)
        // row.Source is only populated for JKP archive rows (see
        // scripts/jkp-scraper) - STIPS rows never carry it.
        if (row.Source) bucket.jkpPrices.push(row.CenaDom)
        else bucket.stipsPrices.push(row.CenaDom)
      })
    return Array.from(byWeek.values())
      .sort((a, b) => a.time - b.time)
      .map(({ time, weekLabel, stipsPrices, jkpPrices }) => ({
        time,
        weekLabel,
        stipsPrice: average(stipsPrices),
        jkpPrice: average(jkpPrices),
      }))
  }, [itemRows, selectedGrad])

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
    history,
    cityComparison,
    cheapest: cityComparison[0] ?? null,
    priciest: cityComparison[cityComparison.length - 1] ?? null,
    marketComparison,
    currentMarket,
  }
}
