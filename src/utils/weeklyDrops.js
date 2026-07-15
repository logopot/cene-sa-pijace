import { shuffleArray } from './shuffle.js'
import { getRowTime } from './week.js'

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

// Tier 1: compare a product's latest recorded price against the datapoint
// immediately before it, wherever those two datapoints came from (a STIPS
// week or a JKP day). This is what "pojeftinilo" actually means and doesn't
// depend on either source's own precomputed Trend label.
function directDrops(rows) {
  const drops = []
  for (const timed of timedRowsByProduct(rows)) {
    const [previous, latest] = timed.slice(-2)
    const currentPrice = parseFloat(latest.row.CenaDom)
    const previousPrice = parseFloat(previous.row.CenaDom)
    if (Number.isNaN(currentPrice) || Number.isNaN(previousPrice)) continue
    if (previousPrice - currentPrice > 0) drops.push(latest.row)
  }
  return drops
}

// Tier 2 fallback: compare the latest price against the average of every
// earlier price on record for that product, in case the single most recent
// pair is an unchanged re-scrape even though the broader trend is downward.
function averageDrops(rows) {
  const drops = []
  for (const timed of timedRowsByProduct(rows)) {
    const latest = timed[timed.length - 1]
    const priorPrices = timed
      .slice(0, -1)
      .map((entry) => parseFloat(entry.row.CenaDom))
      .filter((price) => !Number.isNaN(price))
    if (priorPrices.length === 0) continue
    const previousPrice = priorPrices.reduce((sum, price) => sum + price, 0) / priorPrices.length
    const currentPrice = parseFloat(latest.row.CenaDom)
    if (Number.isNaN(currentPrice)) continue
    if (previousPrice - currentPrice > 0) drops.push(latest.row)
  }
  return drops
}

// Tier 3/4 fallback: the source's own precomputed trend label (only STIPS
// rows carry one - JKP archive rows are always '', see sheetsService.js's
// normalizeJkpRow), one row per product.
function rowsByTrend(rows, trendValue) {
  const seen = new Set()
  const matches = []
  for (const row of rows) {
    if (row.Trend !== trendValue) continue
    const key = productKey(row)
    if (seen.has(key)) continue
    seen.add(key)
    matches.push(row)
  }
  return matches
}

// Picks up to 4 products to feature as "biggest price drops", trying
// progressively looser criteria so the section never disappears just
// because this week's exact snapshot happens to have zero qualifying rows
// (e.g. once JKP's daily archive rows - which never carry a Trend label -
// become the dataset's most recent timestamp, see useMarketExplorer.js).
export function pickWeeklyDrops(rows) {
  const tiers = [
    () => directDrops(rows),
    () => averageDrops(rows),
    () => rowsByTrend(rows, 'pad'),
    () => rowsByTrend(rows, 'bez promene'),
  ]
  for (const tier of tiers) {
    const pool = tier()
    if (pool.length > 0) return shuffleArray(pool).slice(0, 4)
  }
  return []
}
