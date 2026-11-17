import { parseWeekEndTime } from '../utils/week.js'

// How fresh a price must be to be shown as a current price. One definition for the
// whole site: scripts/generate-data.mjs (data files, snapshots, JSON-LD),
// scripts/generate-seo-map.mjs (titles/descriptions), the edge function (through the
// manifest it reads) and the React pages all use these functions.
//
// A product - one market's listing of it, with its size/packaging/origin - is
// FRESH when its newest record is close enough to the newest data of ITS OWN
// source, and STALE otherwise:
//   JKP    at most FRESH_DAYS_JKP days before the newest JKP date
//   STIPS  at most FRESH_WEEKS_STIPS weeks before the newest STIPS week
// The yardstick is the data's own newest date (the "reference", written into
// latest.json), never the clock of the build or of the visitor: a scraper that has
// not run for a month must not turn every price on the site stale.
export const FRESH_DAYS_JKP = 21
export const FRESH_WEEKS_STIPS = 3
// Only a warning in the build log: a reference this much older than the build means
// the scrapers have probably stopped. Behaviour does not change.
export const STALE_REFERENCE_WARN_DAYS = 14

const DAY_MS = 24 * 60 * 60 * 1000

// ---- calendar helpers (whole days, so no clock and no time zone enters) --------

function dayOfParts(year, month, day) {
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS)
}

function dayOfIso(iso) {
  const [year, month, day] = String(iso).slice(0, 10).split('-').map(Number)
  return dayOfParts(year, month, day)
}

export function isoOfDay(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

// Monday-based week number counted from the epoch: consecutive weeks differ by 1,
// across year ends too (the same numbering as weeklyDrops.js's weekIndexOf).
function weekOfDay(day) {
  return Math.floor((day + 3) / 7)
}

// The calendar day of a record: a JKP row's own Date; a STIPS row's week END
// (its Sunday). null for a row with neither.
export function rowDay(row) {
  if (row.Date) return dayOfIso(row.Date)
  const end = parseWeekEndTime(row.NedeljaOpis)
  if (end === null) return null
  const date = new Date(end)
  return dayOfParts(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function sourceKindOfRow(row) {
  return row.Source ? 'jkp' : 'stips'
}

// ---- reference ----------------------------------------------------------------

// { jkp: "2026-11-12", stipsWeek: "2026-11-09" } - the newest JKP date and the
// Monday of the newest STIPS week in `rows` (null for a source with no rows).
export function computeReference(rows) {
  let jkp = null
  let stips = null
  for (const row of rows) {
    const day = rowDay(row)
    if (day === null) continue
    if (row.Source) {
      if (jkp === null || day > jkp) jkp = day
    } else if (stips === null || day > stips) {
      stips = day
    }
  }
  return {
    jkp: jkp === null ? null : isoOfDay(jkp),
    stipsWeek: stips === null ? null : isoOfDay(stips - 6),
  }
}

// How many days older than `now` the newest data is, per source (for the build
// warning). null for a source without data.
export function referenceAgeDays(reference, now = Date.now()) {
  const today = Math.floor(now / DAY_MS)
  return {
    jkp: reference.jkp ? today - dayOfIso(reference.jkp) : null,
    stips: reference.stipsWeek ? today - (dayOfIso(reference.stipsWeek) + 6) : null,
  }
}

// ---- freshness ----------------------------------------------------------------

// Is a record of `kind` ("jkp" | "stips") on calendar day `day` fresh?
export function isFreshDay(day, kind, reference) {
  if (day === null || day === undefined) return false
  if (kind === 'jkp') {
    if (!reference?.jkp) return true
    return dayOfIso(reference.jkp) - day <= FRESH_DAYS_JKP
  }
  if (!reference?.stipsWeek) return true
  return weekOfDay(day) >= weekOfDay(dayOfIso(reference.stipsWeek)) - FRESH_WEEKS_STIPS
}

export function isFreshRow(row, reference) {
  return isFreshDay(rowDay(row), sourceKindOfRow(row), reference)
}

// "24.09.2026" - the date of the record (a STIPS week counts by its Sunday). No
// trailing dot: the texts around it end their own sentences.
export function formatDay(day) {
  const [year, month, date] = isoOfDay(day).split('-')
  return `${date}.${month}.${year}`
}

// "24.09." - the short form used on cards.
export function formatDayShort(day) {
  const [, month, date] = isoOfDay(day).split('-')
  return `${date}.${month}.`
}

export function lastPriceLabel(row, { short = false } = {}) {
  const day = rowDay(row)
  if (day === null) return ''
  return short ? formatDayShort(day) : formatDay(day)
}

// Is a market's or category's whole list stale - not one fresh product in it? Then
// its page says "No current data. Last report: dd.mm.yyyy" (the date of the newest
// record in the list). An empty list is not "stale", it is empty.
export function listingStatus(rows, reference) {
  if (!reference || rows.length === 0) return { noFresh: false, lastReport: '' }
  if (rows.some((row) => isFreshRow(row, reference))) return { noFresh: false, lastReport: '' }
  const days = rows.map(rowDay).filter((day) => day !== null)
  return { noFresh: true, lastReport: days.length > 0 ? formatDay(Math.max(...days)) : '' }
}

// The reference of a row set, computed once per array (the app passes the same
// `rows` array to everything).
const referenceCache = new WeakMap()
export function getReference(rows) {
  if (!referenceCache.has(rows)) referenceCache.set(rows, computeReference(rows))
  return referenceCache.get(rows)
}
