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
// its dropdown (a rolling history, not the full site lifetime).
async function resolveTargetDates() {
  const dates = await listBarometarDates()
  if (process.env.JKP_DATE === 'all') return dates
  if (process.env.JKP_DATE && process.env.JKP_DATE !== 'latest') {
    const match = dates.find((d) => d.date === process.env.JKP_DATE)
    if (!match) throw new Error(`JKP_DATE=${process.env.JKP_DATE} not found in bgpijace.rs barometar history`)
    return [match]
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
