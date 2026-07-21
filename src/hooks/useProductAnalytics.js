import { useMemo } from 'react'
import { parseMesto } from '../utils/market.js'
import { productMatchesSlug } from '../utils/productId.js'
import { getRowLabel, getRowTime } from '../utils/week.js'
import { getAveragePrice as getComparablePrice } from '../utils/price.js'
import { resolveUnit } from '../utils/unit.js'

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

// Picks a single representative price for a city out of its markets' own
// CenaDom-preferring prices (see getComparablePrice), rather than averaging
// them - an unweighted mean was producing a city-level figure that matched
// no real market (Kvantaš at 500 and Skadarlija at 750 blending into a
// Belgrade number of 625 that neither market ever charged), which visually
// contradicted marketComparison's own per-market prices on the same page. A
// single-market city trivially returns that market's own price; a
// multi-market city returns the price the most markets agree on (the mode)
// so the figure stays grounded in an actual observed CenaDom. Ties fall back
// to the lowest price for a deterministic result independent of Map
// iteration order.
function dominantPrice(prices) {
  if (prices.length === 0) return null
  const counts = new Map()
  for (const price of prices) counts.set(price, (counts.get(price) ?? 0) + 1)
  let best = null
  let bestCount = 0
  for (const [price, count] of counts) {
    if (count > bestCount || (count === bestCount && (best === null || price < best))) {
      best = price
      bestCount = count
    }
  }
  return best
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
        price: dominantPrice(cityRows.map(getComparablePrice).filter((price) => price !== null)),
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
  // is looking at. Raw values only (unit/source untranslated) - the page
  // component owns i18n formatting, same convention as `identity` above.
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
      source: latestRows[0].Source ? 'JKP' : 'STIPS',
    }
  }, [itemRows, selectedGrad, selectedPijaca])

  return {
    identity,
    history,
    cityComparison,
    cheapest: cityComparison[0] ?? null,
    priciest: cityComparison[cityComparison.length - 1] ?? null,
    marketComparison,
    cheapestMarket: marketComparison[0] ?? null,
    priciestMarket: marketComparison[marketComparison.length - 1] ?? null,
    currentMarket,
  }
}
