import { listBarometarDates, fetchBarometarTable } from './bgpijaceClient.js'
import { appendRows } from './sheetsClient.js'

const SOURCE_LABEL = 'JKP Beogradske pijace'
const CITY = 'Beograd'

function round2(value) {
  return Math.round(value * 100) / 100
}

function toRows(date, entries) {
  return entries.map((entry) => ({
    Date: date,
    City: CITY,
    Market: entry.market,
    Category: entry.category,
    Product: entry.product,
    Price_Min: entry.priceMin,
    Price_Max: entry.priceMax,
    Price_Avg: round2((entry.priceMin + entry.priceMax) / 2),
    Unit: 'kg',
    Origin: '',
    Source: SOURCE_LABEL,
  }))
}

// JKP_DATE=latest (default) scrapes only the most recently published
// barometar; JKP_DATE=all backfills every date bgpijace.rs still lists in
// its dropdown; JKP_DATE_FROM/JKP_DATE_TO (either or both, inclusive,
// YYYY-MM-DD) backfills just the dates in that window - bgpijace.rs's own
// dropdown turned out to hold onto dates back to 2024-02-29 (verified
// directly against the live site), far further back than a "recent rolling
// window" - so a historical backfill can be pulled straight from the live
// dropdown/table instead of needing any third-party archive.
async function resolveTargetDates() {
  const dates = await listBarometarDates()
  if (process.env.JKP_DATE === 'all') return dates
  if (process.env.JKP_DATE && process.env.JKP_DATE !== 'latest') {
    const match = dates.find((d) => d.date === process.env.JKP_DATE)
    if (!match) throw new Error(`JKP_DATE=${process.env.JKP_DATE} not found in bgpijace.rs barometar history`)
    return [match]
  }
  if (process.env.JKP_DATE_FROM || process.env.JKP_DATE_TO) {
    const from = process.env.JKP_DATE_FROM || '0000-00-00'
    const to = process.env.JKP_DATE_TO || '9999-99-99'
    const inRange = dates.filter((d) => d.date >= from && d.date <= to)
    if (inRange.length === 0) {
      throw new Error(`No barometar dates found between JKP_DATE_FROM=${from} and JKP_DATE_TO=${to}`)
    }
    return inRange
  }
  return [dates[0]]
}

export async function run() {
  const targets = await resolveTargetDates()
  console.log(`Target dates (${targets.length}): ${targets.map((d) => d.date).join(', ')}`)

  let totalAppended = 0
  let totalSkipped = 0
  for (const target of targets) {
    console.log(`Scraping bgpijace.rs barometar for ${target.date} (id ${target.id})`)
    const entries = await fetchBarometarTable(target.id)
    console.log(`  Parsed ${entries.length} market/product price entries`)
    const rows = toRows(target.date, entries)
    const result = await appendRows(rows)
    console.log(`  Appended ${result.appended} rows, skipped ${result.skipped} duplicates.`)
    totalAppended += result.appended
    totalSkipped += result.skipped
  }
  console.log(`Done. Total appended ${totalAppended}, skipped ${totalSkipped} across ${targets.length} date(s).`)
}
