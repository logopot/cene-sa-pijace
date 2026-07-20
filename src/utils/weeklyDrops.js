import { shuffleArray } from './shuffle.js'
import { getRowTime, getLatestWeekTime } from './week.js'

// STIPS updates weekly and JKP updates daily, so anchoring "current" to a
// 7-day window comfortably covers one fresh cycle of either source without
// hardcoding a rigid weekly boundary that would cut a slightly-delayed sync
// out entirely.
const CURRENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function productKey(row) {
  return `${row.Proizvod}-${row.Mesto}`
}

function groupByProduct(rows) {
  const groups = new Map()
  for (const row of rows) {
    const key = productKey(row)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return groups
}

// Each product's own rows, timestamped and sorted oldest-first - only
// products with at least two dated datapoints can have a "before vs after"
// price comparison at all.
function timedRowsByProduct(rows) {
  return Array.from(groupByProduct(rows).values())
    .map((groupRows) =>
      groupRows
        .map((row) => ({ row, time: getRowTime(row) }))
        .filter((entry) => entry.time !== null)
        .sort((a, b) => a.time - b.time),
    )
    .filter((timed) => timed.length >= 2)
}

// A row only counts as an active, currently-listed price if it falls within
// the most recent CURRENT_WINDOW_MS of the dataset's own freshest sync
// (globalLatestTime) - anchored to the data's own timeline rather than the
// real wall clock, since a scrape can legitimately lag the calendar by a
// day or two. A product/market whose latest recorded row predates that
// window is a "ghost": it may still carry an old drop between its last two
// datapoints, but nothing has reported it again since, so it's no longer
// an active listing there and must not surface in this section.
function isCurrentlyActive(time, globalLatestTime) {
  return time !== null && globalLatestTime !== null && globalLatestTime - time <= CURRENT_WINDOW_MS
}

// Tier 1: compare a product's latest recorded price against the datapoint
// immediately before it, wherever those two datapoints came from (a STIPS
// week or a JKP day) - the immediately-preceding price for that exact
// market, never an all-time low/high. This is what "pojeftinilo" actually
// means and doesn't depend on either source's own precomputed Trend label.
function directDrops(rows, globalLatestTime) {
  const drops = []
  for (const timed of timedRowsByProduct(rows)) {
    const [previous, latest] = timed.slice(-2)
    if (!isCurrentlyActive(latest.time, globalLatestTime)) continue
    const currentPrice = parseFloat(latest.row.CenaDom)
    const previousPrice = parseFloat(previous.row.CenaDom)
    if (Number.isNaN(currentPrice) || Number.isNaN(previousPrice)) continue
    if (previousPrice - currentPrice > 0) drops.push(latest.row)
  }
  return drops
}

// Tier 2/3 fallback: the source's own precomputed trend label (only STIPS
// rows carry one - JKP archive rows are always '', see sheetsService.js's
// normalizeJkpRow), one row per product - still gated to the market's own
// current sync so a stale row can't surface just because it once carried a
// matching trend label.
function rowsByTrend(rows, trendValue, globalLatestTime) {
  const seen = new Set()
  const matches = []
  for (const row of rows) {
    if (row.Trend !== trendValue) continue
    if (!isCurrentlyActive(getRowTime(row), globalLatestTime)) continue
    const key = productKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    matches.push(row)
  }
  return matches
}

// Picks up to 8 products to feature as "biggest price drops", trying
// progressively looser criteria so the section never disappears just
// because this week's exact snapshot happens to have zero qualifying rows
// (e.g. once JKP's daily archive rows - which never carry a Trend label -
// become the dataset's most recent timestamp, see useMarketExplorer.js).
// Every tier is gated to each row's own market being currently active (see
// isCurrentlyActive) so a product that stopped being reported at a market
// weeks or months ago can never resurface here as a "ghost" drop.
export function pickWeeklyDrops(rows) {
  const globalLatestTime = getLatestWeekTime(rows)
  const tiers = [
    () => directDrops(rows, globalLatestTime),
    () => rowsByTrend(rows, 'pad', globalLatestTime),
    () => rowsByTrend(rows, 'bez promene', globalLatestTime),
  ]
  for (const tier of tiers) {
    const pool = tier()
    if (pool.length > 0) return shuffleArray(pool).slice(0, 8)
  }
  return []
}
