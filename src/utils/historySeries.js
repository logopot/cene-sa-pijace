import { parseMesto } from './market.js'
import { getRowTime, getRowLabel } from './week.js'
import { FRESH_DAYS_JKP, FRESH_WEEKS_STIPS } from '../data/freshness.js'

// The price-history chart of a product page draws the prices of the market the page
// is about (the "selected" series) and, for comparison, those of the wholesale
// market of the same city (the "reference" series) - never a city-wide average of
// a source. Everything that decides WHAT is drawn and HOW IT IS NAMED is here, as
// pure functions.

// The wholesale market of a city: the raw (Serbian) market name in the data
// ("Kvantaška pijaca"; shown as "Wholesale Market" in English).
export const REFERENCE_MARKET = 'Kvantaška pijaca'

const DAY_MS = 24 * 60 * 60 * 1000

// The longest gap between two consecutive records of ONE series that its line still
// bridges, in days - the same limits as the freshness rule (data/freshness.js): a
// JKP line may skip 21 days, a STIPS line 3 weeks. A longer silence is a gap: the
// line and its shaded area are not drawn through it.
export function maxGapDays(kind) {
  return kind === 'jkp' ? FRESH_DAYS_JKP : FRESH_WEEKS_STIPS * 7
}

// Splits the indices of one series' records (ascending positions in the chart's data)
// into runs that are no further apart than the limit. `times` are the records' times
// in ms. A gap of exactly the limit is bridged. Whole days are compared (a daylight-
// saving hour does not matter).
export function segmentIndices(indices, times, kind) {
  const limit = maxGapDays(kind)
  const segments = []
  indices.forEach((index, i) => {
    const gapDays = i === 0 ? 0 : Math.round((times[i] - times[i - 1]) / DAY_MS)
    if (i === 0 || gapDays > limit) segments.push([index])
    else segments[segments.length - 1].push(index)
  })
  return segments
}

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

  // Each series is cut into segments at the gaps. A segment gets its own data key
  // ("<series key>#<n>") holding the series' values for exactly its records, so the
  // chart draws one line per segment and nothing across a gap.
  for (const entry of series) {
    const indices = []
    history.forEach((point, index) => {
      if (point[entry.key] !== null && point[entry.key] !== undefined) indices.push(index)
    })
    entry.segments = segmentIndices(indices, indices.map((index) => history[index].time), entry.kind).map((run, n) => {
      const dataKey = `${entry.key}#${n}`
      for (const index of run) history[index][dataKey] = history[index][entry.key]
      return { dataKey, indices: run, isolated: run.length === 1 }
    })
  }
  return { series, history }
}

// The one-sentence note under the chart: only when a reference line is drawn next
// to the selected market's own.
export function showsReferenceLine(series) {
  return series.length > 1 && series.some((entry) => entry.role === 'reference') && series.some((entry) => entry.role === 'selected')
}

// ---- the point under the cursor --------------------------------------------------

// Where a pointer is in the chart's own coordinates, from nothing but its screen
// position and the chart's bounding box - never from the event's target, so it makes
// no difference whether the pointer is over a rect, a line, a dot, an area or the
// svg itself. `inside` is whether that point is in the plot area.
export function locateCursor({ clientX, clientY, box, plot, slack = 1 }) {
  const x = clientX - box.left
  const y = clientY - box.top
  // slack: a pixel of leeway at the plot edges (positions are fractional).
  const inside = x >= plot.x - slack && x <= plot.x + plot.width + slack && y >= plot.y - slack && y <= plot.y + plot.height + slack
  return { x, y, inside }
}

// Which points of the chart to show for a cursor position (pixels in the chart's own
// coordinates). Pure - the chart gives it its scales:
//   xOf(index)        pixel x of a position in the data
//   yOf(value)        pixel y of a price
//   valueAt(index, key)  the series' value at that position
// A series takes part only where it has a line under the cursor's x: between the
// first and last record of one of its segments (a single record counts within
// \`tolerance\` pixels of it). Never in a gap. Of those series the one whose line is
// closest to the cursor vertically wins - its record nearest in x is shown; another
// series is shown with it only if it has a record at the very same position (the same
// date). Returns [{ key, index, value }] in the series' own order, [] for none.
export function selectHoverPoints({ series, cursor, xOf, yOf, valueAt, tolerance = 6, edge = 2 }) {
  const candidates = []
  for (const entry of series) {
    for (const segment of entry.segments ?? []) {
      const first = xOf(segment.indices[0])
      const last = xOf(segment.indices[segment.indices.length - 1])
      // `edge` pixels of slack at the ends of a line (the cursor is a pixel, a record is a point).
      const inside = segment.isolated ? Math.abs(cursor.x - first) <= tolerance : cursor.x >= first - edge && cursor.x <= last + edge
      if (!inside) continue

      // The record nearest to the cursor in x, and the line's height at the cursor.
      let nearest = segment.indices[0]
      let lineY = yOf(valueAt(nearest, entry.key))
      for (let i = 0; i < segment.indices.length; i += 1) {
        const index = segment.indices[i]
        if (Math.abs(xOf(index) - cursor.x) < Math.abs(xOf(nearest) - cursor.x)) nearest = index
        const next = segment.indices[i + 1]
        if (next !== undefined && cursor.x >= xOf(index) && cursor.x <= xOf(next)) {
          const span = xOf(next) - xOf(index)
          const t = span === 0 ? 0 : (cursor.x - xOf(index)) / span
          const a = yOf(valueAt(index, entry.key))
          const b = yOf(valueAt(next, entry.key))
          lineY = a + (b - a) * t
        }
      }
      candidates.push({ key: entry.key, index: nearest, value: valueAt(nearest, entry.key), distance: Math.abs(cursor.y - lineY) })
      break
    }
  }
  if (candidates.length === 0) return []
  const best = candidates.reduce((winner, candidate) => (candidate.distance < winner.distance ? candidate : winner))
  const order = new Map(series.map((entry, position) => [entry.key, position]))
  return candidates
    .filter((candidate) => candidate === best || candidate.index === best.index)
    .sort((a, b) => order.get(a.key) - order.get(b.key))
    .map(({ key, index, value }) => ({ key, index, value }))
}
