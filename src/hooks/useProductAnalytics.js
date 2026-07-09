import { useMemo } from 'react'
import { parseMesto } from '../utils/market.js'
import { productMatchesSlug } from '../utils/productId.js'
import { getRowLabel, getRowTime } from '../utils/week.js'

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
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
      proizvod: row?.Proizvod ?? '',
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

  const latestWeekTime = useMemo(() => {
    const times = itemRows.map((row) => getRowTime(row)).filter((time) => time !== null)
    return times.length === 0 ? null : Math.max(...times)
  }, [itemRows])

  const cityComparison = useMemo(() => {
    if (latestWeekTime === null) return []
    const byCity = new Map()
    itemRows
      .filter((row) => getRowTime(row) === latestWeekTime)
      .forEach((row) => {
        const { grad } = parseMesto(row.Mesto)
        if (!byCity.has(grad)) byCity.set(grad, [])
        byCity.get(grad).push(row.CenaDom)
      })
    return Array.from(byCity.entries())
      .map(([grad, prices]) => ({ grad, price: average(prices) }))
      .filter((entry) => entry.price !== null)
      .sort((a, b) => a.price - b.price)
  }, [itemRows, latestWeekTime])

  return {
    identity,
    history,
    cityComparison,
    cheapest: cityComparison[0] ?? null,
    priciest: cityComparison[cityComparison.length - 1] ?? null,
  }
}
