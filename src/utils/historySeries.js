import { parseMesto } from './market.js'
import { getRowTime, getRowLabel } from './week.js'

// The price-history chart of a product page draws the prices of the market the page
// is about (the "selected" series) and, for comparison, those of the wholesale
// market of the same city (the "reference" series) - never a city-wide average of
// a source. Everything that decides WHAT is drawn and HOW IT IS NAMED is here, as
// pure functions.

// The wholesale market of a city: the raw (Serbian) market name in the data
// ("Kvantaška pijaca"; shown as "Wholesale Market" in English).
export const REFERENCE_MARKET = 'Kvantaška pijaca'

function average(values) {
  const valid = values.filter((value) => value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value)))
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + Number(value), 0) / valid.length
}

// STIPS rows carry no Source; every row with one is from a JKP/municipal archive.
export function seriesKindOf(source) {
  return source && source !== 'STIPS' ? 'jkp' : 'stips'
}

// "Kalenić (JKP)", "Kvantaška pijaca (STIPS)": the market's own name as the rest of
// the site shows it, then the data source in short.
export function formatSeriesLabel(marketName, kind) {
  return `${marketName} (${kind === 'jkp' ? 'JKP' : 'STIPS'})`
}

// rows: the product family's rows of every market (any source, any week).
// Returns:
//   series   [{ key, role: 'selected' | 'reference', pijaca, source, kind }] - the
//            selected market's series first. The reference series exists only when
//            the selected market is not itself the wholesale market and the city
//            has data for it.
//   history  one point per reporting time: { time, weekLabel, [key]: average price }
// A market's rows are split by their own Source only if it ever has two (a market
// listed by two sources shows two lines, each named for its source).
export function buildHistorySeries(rows, grad, pijaca) {
  const inMarket = (row, market) => {
    const parsed = parseMesto(row.Mesto)
    return parsed.grad === grad && parsed.pijaca === market
  }
  const groups = [
    { role: 'selected', pijaca, rows: rows.filter((row) => inMarket(row, pijaca)) },
    ...(pijaca !== REFERENCE_MARKET ? [{ role: 'reference', pijaca: REFERENCE_MARKET, rows: rows.filter((row) => inMarket(row, REFERENCE_MARKET)) }] : []),
  ]

  const series = []
  const weeks = new Map()
  for (const group of groups) {
    const keys = new Map()
    for (const row of group.rows) {
      const time = getRowTime(row)
      if (time === null) continue
      const source = row.Source || 'STIPS'
      const key = `${group.role}|${source}`
      if (!keys.has(key)) {
        keys.set(key, { key, role: group.role, pijaca: group.pijaca, source, kind: seriesKindOf(row.Source) })
      }
      if (!weeks.has(time)) weeks.set(time, { time, weekLabel: getRowLabel(row), values: new Map() })
      const bucket = weeks.get(time)
      if (!bucket.values.has(key)) bucket.values.set(key, [])
      bucket.values.get(key).push(row.CenaDom)
    }
    series.push(...keys.values())
  }

  const history = Array.from(weeks.values())
    .sort((a, b) => a.time - b.time)
    .map(({ time, weekLabel, values }) => ({
      time,
      weekLabel,
      ...Object.fromEntries(Array.from(values, ([key, prices]) => [key, average(prices)])),
    }))
  return { series, history }
}

// The one-sentence note under the chart: only when a reference line is drawn next
// to the selected market's own.
export function showsReferenceLine(series) {
  return series.length > 1 && series.some((entry) => entry.role === 'reference') && series.some((entry) => entry.role === 'selected')
}
