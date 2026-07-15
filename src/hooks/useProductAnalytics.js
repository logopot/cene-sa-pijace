import { useMemo } from 'react'
import { parseMesto } from '../utils/market.js'
import { productMatchesSlug } from '../utils/productId.js'
import { getRowLabel, getRowTime } from '../utils/week.js'

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

// CenaDom is normally a precomputed single price (see sheetsService.js), but
// falls back to the mathematical midpoint of CenaMin/CenaMax so a STIPS
// price *range* still yields one comparable number instead of dropping out
// of the comparison entirely.
function getComparablePrice(row) {
  if (row.CenaDom !== null && row.CenaDom !== undefined) return row.CenaDom
  return average([row.CenaMin, row.CenaMax])
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

export function useProductAnalytics(rows, productSlug, filters, selectedGrad, categoryName) {
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
      .map(([grad, { rows: cityRows }]) => ({ grad, price: average(cityRows.map(getComparablePrice)) }))
      .filter((entry) => entry.price !== null)
      .sort((a, b) => a.price - b.price)
  }, [itemRows])

  return {
    identity,
    history,
    cityComparison,
    cheapest: cityComparison[0] ?? null,
    priciest: cityComparison[cityComparison.length - 1] ?? null,
  }
}
