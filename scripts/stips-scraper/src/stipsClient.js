import * as cheerio from 'cheerio'

const USER_AGENT = 'Mozilla/5.0 (compatible; moja-pijaca-scraper/0.1)'

function baseUrl() {
  return process.env.STIPS_BASE_URL || 'https://www.stips.minpolj.gov.rs'
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) {
    throw new Error(`STIPS request failed (${res.status}): ${url}`)
  }
  return res.json()
}

// Weeks are identified by an opaque STIPS id, not the plain week number,
// so callers must resolve a (year, week-of-year) pair through this endpoint.
export async function listWeeks(year) {
  const json = await getJson(`${baseUrl()}/stips/ajax/nedelje_za_godinu/${year}`)
  // Raw labels look like "26. (22.06.2026-28.06.2026)($=102.46)" - the
  // trailing exchange-rate part is STIPS UI chrome, not week data, so strip it.
  return json.result.nedelje.map(([id, label]) => ({ id, label: label.replace(/\(\$=[\d.,]+\)\s*$/, '').trim() }))
}

// Which markets report prices depends on the category (e.g. Mleko has fewer
// reporting markets than Povrće), so this must be re-fetched per category.
export async function listMarketsForCategory(kategorijaId) {
  const json = await getJson(`${baseUrl()}/stips/ajax/mesta_za_kat/${kategorijaId}/`)
  return json.result.mesta.map(([id, name]) => ({ id, name }))
}

function parsePrice(text) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const value = Number(trimmed.replace(',', '.'))
  return Number.isNaN(value) ? null : value
}

// Each STIPS category renders a differently-shaped table: livestock ("Meso")
// swaps Pakovanje/Poreklo/JedMere for Težina/uzrast + Rasa, eggs/dairy/milk
// drop Veličina and Pakovanje, grains drop Veličina - only Voće/Povrće use
// the full 5-identity-column layout. Rather than assume a fixed column
// count, read the identity columns (everything between "R.Br." and the
// "Cena(din)" group) from each table's own header row and map them by label.
const HEADER_FIELD_PATTERNS = [
  { pattern: /^naziv/i, field: 'proizvod' },
  { pattern: /^proizvod$/i, field: 'proizvod' },
  { pattern: /^veli.ina$/i, field: 'velicina' },
  { pattern: /te.ina.*uzrast/i, field: 'velicina' },
  { pattern: /^pakovanje$/i, field: 'pakovanje' },
  { pattern: /^poreklo$/i, field: 'poreklo' },
  { pattern: /^jed\.?\s*mere$/i, field: 'jedMere' },
]

// Unmapped headers (e.g. livestock's "Rasa"/breed) are dropped - there's no
// column for them in our sheet schema.
function mapHeaderToField(label) {
  return HEADER_FIELD_PATTERNS.find(({ pattern }) => pattern.test(label.trim()))?.field ?? null
}

function parsePriceTable(html) {
  const $ = cheerio.load(html)
  const rows = []

  $('table').each((_, table) => {
    const headerCells = $(table)
      .find('thead tr')
      .first()
      .find('td')
      .map((__, td) => $(td).text().trim())
      .get()
    // headerCells[0] is "R.Br.", followed by the identity columns, then the
    // "Cena(din)" group cell (colspan=3) and finally Trend/Ponuda/Komentar.
    const cenaIndex = headerCells.findIndex((label) => /^cena/i.test(label))
    const identityFields = headerCells.slice(1, cenaIndex).map(mapHeaderToField)
    const expectedCells = identityFields.length + 7 // + rbr + min/max/dom + trend/ponuda/komentar

    $(table)
      .find('tbody tr')
      .each((__, tr) => {
        const cells = $(tr)
          .find('td')
          .map((___, td) => $(td).text().trim())
          .get()
        if (cells.length < expectedCells) return

        const record = { rbr: Number(cells[0]) || null, proizvod: '', velicina: '', pakovanje: '', poreklo: '', jedMere: '' }
        identityFields.forEach((field, i) => {
          if (field) record[field] = cells[1 + i]
        })

        const priceStart = 1 + identityFields.length
        record.cenaMin = parsePrice(cells[priceStart])
        record.cenaMax = parsePrice(cells[priceStart + 1])
        record.cenaDom = parsePrice(cells[priceStart + 2])
        record.trend = cells[priceStart + 3]
        record.ponuda = cells[priceStart + 4]
        record.komentar = cells[priceStart + 5]

        rows.push(record)
      })
  })

  return rows
}

const WEEK_LABEL_RE = /\((\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})\)/

// A week's date range has ended once its end date is in the past - STIPS
// lists future weeks in the dropdown before any data exists for them.
export function hasWeekEnded(week) {
  const match = week.label.match(WEEK_LABEL_RE)
  if (!match) return false
  const [, , , , endDay, endMonth, endYear] = match
  const endDate = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay))
  return endDate.getTime() <= Date.now()
}

// Week labels look like "26. (22.06.2026-28.06.2026)($=102.46)" - resolve
// "latest" to the most recent week whose date range has already ended.
export function resolveLatestWeek(weeks) {
  return weeks.find(hasWeekEnded) ?? weeks[0]
}

// One (kategorija, mesto, godina, nedelja) call returns every product STIPS
// tracks for that market in that week, as a JSON envelope wrapping a raw
// HTML <table> - so each row still needs parsing with parsePriceTable().
export async function fetchPriceTable({ kategorijaId, godina, nedeljaId, mestoId }) {
  const url = new URL(`${baseUrl()}/stips/ajax/detaljni`)
  url.searchParams.set('kategorija', kategorijaId)
  url.searchParams.set('godina', godina)
  url.searchParams.set('nedelja', nedeljaId)
  url.searchParams.set('mesto', mestoId)
  url.searchParams.set('format', 'html')

  const json = await getJson(url.toString())
  if (json.errors && json.errors.length > 0) {
    // STIPS returns this when a market simply didn't report any prices for
    // that category/week - not every market covers every category, so this
    // is an expected empty result, not a failure.
    if (json.errors.some((e) => e.includes('Ne postoji cenovnik'))) {
      return []
    }
    throw new Error(`STIPS returned errors for ${url}: ${JSON.stringify(json.errors)}`)
  }
  return parsePriceTable(json.html)
}
