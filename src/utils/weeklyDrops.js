import { getRowTime } from './week.js'
import { computeReference, isFreshRow } from '../data/freshness.js'

// "Najveća pojeftinjenja ove nedelje" - the ONE place that decides which products
// are shown there. The homepage (live app and its build-time prerender) and the
// static text snapshot (scripts/generate-data.mjs) all call analyzeWeeklyDrops, so
// the cards, their order and their badge can never disagree.

// A price counts as a drop when it fell by at least this much against the previous
// week (-0.03 = 3%). Change it here and everything follows.
export const DROP_THRESHOLD = -0.03

// At most this many cards; fewer if fewer products qualify, none hides the section.
export const MAX_WEEKLY_DROPS = 12

const DAY_MS = 24 * 60 * 60 * 1000

// Monday-based week number counted from the epoch, so consecutive weeks differ by
// exactly 1 across year ends (and daylight-saving changes): a STIPS week
// ("26.10.-01.11.", dated by its Sunday) and a JKP day inside the same Monday-to-
// Sunday span get the same number.
export function weekIndexOf(time) {
  const date = new Date(time)
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
  return Math.floor((days + 3) / 7)
}

const sourceOf = (row) => row.Source || ''

// One product at one market from one source (and one size, packaging, origin):
// only rows of the same identity are ever compared with each other.
function identityOf(row) {
  return [row.Proizvod, row.Mesto, sourceOf(row), row.Velicina ?? '', row.Pakovanje ?? '', row.Poreklo ?? ''].join('|')
}

function priceOf(row) {
  if (row.CenaDom === '' || row.CenaDom === null || row.CenaDom === undefined) return null
  const value = Number(row.CenaDom)
  return Number.isFinite(value) ? value : null
}

// Walks the rows once and returns the drops plus the numbers the selection was
// made of (for tests and for checking the result by eye):
//   drops      [{ row, previousRow, change }] best first - row is the current
//              week's record, previousRow the one of the week right before it,
//              change = (current - previous) / previous (negative)
//   candidates records of each source's current week
//   rejected   { noPreviousWeek, risingTrend, noPrice, belowThreshold }
//
// Rules:
// - The current week is each source's own latest week (STIPS and JKP are not
//   mixed); a record of an older week is not a candidate.
// - It needs a record of the same source/product/market(/size/packaging/origin)
//   in exactly the week before. No such record: rejected - never compared with
//   an older week.
// - The source's own Trend "rast" rejects it, so a card can never contradict the
//   section's title; "pad", "-", empty or "bez promene" leave the decision to the
//   computed change.
// - change <= DROP_THRESHOLD qualifies. Sorted by size of the drop, ties in data order.
export function analyzeWeeklyDrops(rows) {
  const timed = []
  rows.forEach((row, order) => {
    const time = getRowTime(row)
    if (time !== null) timed.push({ row, order, time, week: weekIndexOf(time) })
  })

  const latestWeekBySource = new Map()
  for (const { row, week } of timed) {
    const source = sourceOf(row)
    if (!latestWeekBySource.has(source) || week > latestWeekBySource.get(source)) latestWeekBySource.set(source, week)
  }

  // identity -> week -> the record of that week (the latest one if several).
  const byIdentity = new Map()
  for (const entry of timed) {
    const key = identityOf(entry.row)
    if (!byIdentity.has(key)) byIdentity.set(key, new Map())
    const weeks = byIdentity.get(key)
    const existing = weeks.get(entry.week)
    if (!existing || entry.time > existing.time) weeks.set(entry.week, entry)
  }

  const rejected = { noPreviousWeek: 0, risingTrend: 0, noPrice: 0, belowThreshold: 0 }
  const found = []
  let candidates = 0

  for (const weeks of byIdentity.values()) {
    const current = weeks.get(latestWeekBySource.get(sourceOf(Array.from(weeks.values())[0].row)))
    if (!current) continue
    candidates += 1
    const previous = weeks.get(current.week - 1)
    if (!previous) {
      rejected.noPreviousWeek += 1
      continue
    }
    if (current.row.Trend === 'rast') {
      rejected.risingTrend += 1
      continue
    }
    const now = priceOf(current.row)
    const before = priceOf(previous.row)
    if (now === null || before === null || before <= 0) {
      rejected.noPrice += 1
      continue
    }
    const change = (now - before) / before
    if (change > DROP_THRESHOLD) {
      rejected.belowThreshold += 1
      continue
    }
    found.push({ row: current.row, previousRow: previous.row, change, order: current.order })
  }

  found.sort((a, b) => a.change - b.change || a.order - b.order)
  const drops = found.slice(0, MAX_WEEKLY_DROPS).map(({ row, previousRow, change }) => ({ row, previousRow, change }))

  // The section's promise, checked where the list is made: every card is a real
  // drop and none carries a rising trend.
  // ...and every card is a current price: a stale product (data/freshness.js) never
  // reaches it.
  const reference = computeReference(rows)
  for (const { row, change } of drops) {
    if (!(change <= DROP_THRESHOLD) || row.Trend === 'rast') throw new Error('weekly drops: a non-drop reached the list')
    if (!isFreshRow(row, reference)) throw new Error('weekly drops: a stale product reached the list')
  }
  return { drops, candidates, rejected, total: found.length }
}

// The list shown on the homepage.
export function pickWeeklyDrops(rows) {
  return analyzeWeeklyDrops(rows).drops
}

// 6 for a change of -0.0606: the whole percent the badge shows (the sign is in its text).
export function dropPercent(change) {
  return Math.round(Math.abs(change) * 100)
}
