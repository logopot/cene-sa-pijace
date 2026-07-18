import { google } from 'googleapis'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// The client-side VITE_GOOGLE_SHEETS_API_KEY (see src/services/sheetsService.js)
// is HTTP-referrer restricted for browser use and returns 403 from a
// server/build context (no Referer header). Build scripts authenticate as the
// same service account the STIPS/JKP scrapers already use instead - it
// already has editor access to the sheet, which covers read.
//
// Locally that account's key file lives at scripts/stips-scraper/service-account.json
// (gitignored, never committed - see .gitignore). CI/Cloudflare Pages has no
// access to that file, so production builds must supply the same JSON via the
// GOOGLE_SERVICE_ACCOUNT_JSON build environment variable instead.
function getAuth() {
  const inlineCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (inlineCredentials) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(inlineCredentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })
  }

  const localKeyFile = path.join(ROOT, 'scripts/stips-scraper/service-account.json')
  return new google.auth.GoogleAuth({
    keyFile: localKeyFile,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

function getSpreadsheetConfig() {
  return {
    spreadsheetId: process.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID,
    sheetName: process.env.VITE_GOOGLE_SHEETS_SHEET_NAME || 'Prices',
    jkpSheetName: process.env.VITE_GOOGLE_SHEETS_JKP_SHEET_NAME || 'JKP_Prices',
  }
}

const NUMERIC_COLUMNS = new Set(['Godina', 'Nedelja', 'RBr', 'CenaMin', 'CenaMax', 'CenaDom'])

function parseNumeric(raw) {
  if (raw === undefined || raw === '') return null
  const value = Number(String(raw).replace(',', '.'))
  return Number.isNaN(value) ? null : value
}

// Mirrors src/services/sheetsService.js's parseRows exactly (same sheet, same
// header-driven parsing) - kept as a separate copy rather than a shared
// import because that file is written against import.meta.env, which doesn't
// exist in a plain Node script.
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

const JKP_NUMERIC_COLUMNS = new Set(['Price_Min', 'Price_Max', 'Price_Avg'])

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

// Fetches every price row (STIPS + JKP archive, same union src/hooks/useMarketPrices.js
// builds client-side) so the SEO manifest and OG images are generated from
// the exact same market/product universe the live site renders.
export async function fetchAllMarketRows() {
  const { spreadsheetId, sheetName, jkpSheetName } = getSpreadsheetConfig()
  if (!spreadsheetId) {
    throw new Error('Missing VITE_GOOGLE_SHEETS_SPREADSHEET_ID')
  }

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const stipsResult = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:R`,
  })
  const stipsRows = parseRows(stipsResult.data.values)

  let jkpRows = []
  try {
    const jkpResult = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${jkpSheetName}!A:K`,
    })
    jkpRows = parseJkpRows(jkpResult.data.values)
  } catch {
    // Same as sheetsService.js's fetchJkpPrices: the JKP tab only exists
    // once that scraper has run at least once - absence just means no JKP
    // data yet, not a failure.
  }

  return [...stipsRows, ...jkpRows]
}

export function readLocalEnvFile() {
  const envPath = path.join(ROOT, '.env')
  try {
    process.loadEnvFile(envPath)
  } catch {
    // No local .env (e.g. CI, which supplies real env vars directly) - fine.
  }
}

export function readJsonFile(relativePath) {
  return JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf-8'))
}

export { ROOT }
