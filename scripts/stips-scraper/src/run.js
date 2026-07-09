import { CATEGORIES } from './categories.js'
import { listWeeks, listMarketsForCategory, resolveLatestWeek, hasWeekEnded, fetchPriceTable } from './stipsClient.js'
import { upsertRows } from './sheetsClient.js'

// Small delay between market fetches so a full-year backfill (dozens of
// weeks x 7 categories x many markets) doesn't hammer the gov site.
const REQUEST_DELAY_MS = 150

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// STIPS_WEEK=all backfills every week whose date range has already ended,
// in chronological order (listWeeks returns them newest-first).
async function resolveTargetWeeks(year) {
  const weeks = await listWeeks(year)
  if (process.env.STIPS_WEEK === 'all') {
    return weeks.filter(hasWeekEnded).reverse()
  }
  if (process.env.STIPS_WEEK && process.env.STIPS_WEEK !== 'latest') {
    const week = weeks.find((w) => String(w.id) === process.env.STIPS_WEEK)
    if (!week) throw new Error(`STIPS_WEEK=${process.env.STIPS_WEEK} not found for year ${year}`)
    return [week]
  }
  return [resolveLatestWeek(weeks)]
}

async function scrapeWeek(year, week) {
  console.log(`Scraping STIPS prices for ${year}, week: ${week.label} (id ${week.id})`)
  const scrapedAt = new Date().toISOString()
  const rows = []

  for (const category of CATEGORIES) {
    const markets = await listMarketsForCategory(category.id)
    console.log(`  ${category.name}: ${markets.length} markets`)

    for (const market of markets) {
      const products = await fetchPriceTable({
        kategorijaId: category.id,
        godina: year,
        nedeljaId: week.id,
        mestoId: market.id,
      })
      await delay(REQUEST_DELAY_MS)

      for (const product of products) {
        rows.push({
          Godina: year,
          Nedelja: week.id,
          NedeljaOpis: week.label,
          Kategorija: category.name,
          Mesto: market.name,
          RBr: product.rbr,
          Proizvod: product.proizvod,
          Velicina: product.velicina,
          Pakovanje: product.pakovanje,
          Poreklo: product.poreklo,
          JedMere: product.jedMere,
          CenaMin: product.cenaMin,
          CenaMax: product.cenaMax,
          CenaDom: product.cenaDom,
          Trend: product.trend,
          Ponuda: product.ponuda,
          Komentar: product.komentar,
          ScrapedAt: scrapedAt,
        })
      }
    }
  }

  return rows
}

export async function run() {
  const year = Number(process.env.STIPS_YEAR)
  const weeks = await resolveTargetWeeks(year)
  console.log(`Target weeks (${weeks.length}): ${weeks.map((w) => w.label).join(', ')}`)

  let totalUpdated = 0
  let totalAppended = 0
  for (const week of weeks) {
    const rows = await scrapeWeek(year, week)
    console.log(`Scraped ${rows.length} price rows for week ${week.label}, upserting to Google Sheets...`)
    const result = await upsertRows(rows)
    console.log(`  Updated ${result.updated} rows, appended ${result.appended} rows.`)
    totalUpdated += result.updated
    totalAppended += result.appended
  }
  console.log(`Done. Total updated ${totalUpdated}, appended ${totalAppended} across ${weeks.length} week(s).`)
}
