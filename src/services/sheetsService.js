const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

// Columns whose values should be parsed as numbers rather than left as strings.
const NUMERIC_COLUMNS = new Set(['Godina', 'Nedelja', 'RBr', 'CenaMin', 'CenaMax', 'CenaDom'])

function parseNumeric(raw) {
  if (raw === undefined || raw === '') return null
  const value = Number(String(raw).replace(',', '.'))
  return Number.isNaN(value) ? null : value
}

// The sheet's header row is read at fetch time rather than hardcoded here,
// so this stays in sync automatically if the scraper's column set changes.
function parseRows(values) {
  if (!values || values.length === 0) return []
  const [header, ...rows] = values
  return rows.map((row) => {
    const record = {}
    header.forEach((col, i) => {
      const raw = row[i]
      record[col] = NUMERIC_COLUMNS.has(col) ? parseNumeric(raw) : (raw ?? '')
    })
    return record
  })
}

export async function fetchMarketPrices() {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = import.meta.env.VITE_GOOGLE_SHEETS_SHEET_NAME || 'Prices'

  if (!apiKey || !spreadsheetId) {
    throw new Error('Missing Google Sheets configuration: set VITE_GOOGLE_SHEETS_API_KEY and VITE_GOOGLE_SHEETS_SPREADSHEET_ID in .env')
  }

  const range = encodeURIComponent(`${sheetName}!A:R`)
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Google Sheets request failed (${res.status})`)
  }
  const json = await res.json()
  return parseRows(json.values)
}

// Columns in the JKP archive sheet (see scripts/jkp-scraper) whose values
// should be parsed as numbers.
const JKP_NUMERIC_COLUMNS = new Set(['Price_Min', 'Price_Max', 'Price_Avg'])

// Maps the JKP archive's own schema onto the common row shape STIPS rows
// already use, so every existing util (parseMesto, ProductCard, filters,
// analytics) works on JKP rows without special-casing. Mesto is rebuilt as
// "Market-City-Type" to match parseMesto's named-market format (see
// src/utils/market.js) - bgpijace.rs's markets are all retail "zelena
// pijaca" markets. Godina/Nedelja/NedeljaOpis don't apply to a
// daily-cadence archive, so they're left null/empty; Date carries the
// real time axis instead (see src/utils/week.js's getRowTime/getRowLabel).
function normalizeJkpRow(row) {
  return {
    Godina: null,
    Nedelja: null,
    NedeljaOpis: '',
    Date: row.Date,
    Kategorija: row.Category,
    Mesto: `${row.Market}-${row.City}-zelena pijaca`,
    RBr: null,
    Proizvod: row.Product,
    Velicina: '',
    Pakovanje: '',
    Poreklo: row.Origin || '',
    JedMere: row.Unit,
    CenaMin: row.Price_Min,
    CenaMax: row.Price_Max,
    CenaDom: row.Price_Avg,
    Trend: '',
    Ponuda: '',
    Komentar: '',
    ScrapedAt: row.Date,
    Source: row.Source,
  }
}

function parseJkpRows(values) {
  if (!values || values.length === 0) return []
  const [header, ...rows] = values
  return rows.map((row) => {
    const record = {}
    header.forEach((col, i) => {
      const raw = row[i]
      record[col] = JKP_NUMERIC_COLUMNS.has(col) ? parseNumeric(raw) : (raw ?? '')
    })
    return normalizeJkpRow(record)
  })
}

// Reads the JKP historical archive tab (see scripts/jkp-scraper). That tab
// is only created once the JKP scraper has run at least once, so a missing
// sheet/tab (400 from the Sheets API) is treated as "no JKP data yet"
// rather than failing the whole app's price fetch.
export async function fetchJkpPrices() {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = import.meta.env.VITE_GOOGLE_SHEETS_JKP_SHEET_NAME || 'JKP_Prices'

  if (!apiKey || !spreadsheetId) {
    throw new Error('Missing Google Sheets configuration: set VITE_GOOGLE_SHEETS_API_KEY and VITE_GOOGLE_SHEETS_SPREADSHEET_ID in .env')
  }

  const range = encodeURIComponent(`${sheetName}!A:K`)
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 400) return []
    throw new Error(`Google Sheets request failed (${res.status})`)
  }
  const json = await res.json()
  return parseJkpRows(json.values)
}
