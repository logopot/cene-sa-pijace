import { google } from 'googleapis'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// Build scripts authenticate as the same service account the STIPS/JKP
// scrapers use - it already has editor access to the sheet, which covers read.
// The browser never talks to Google Sheets: everything it shows comes from the
// static files generated from this fetch (see scripts/generate-data.mjs).
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

// Fetches every price row (STIPS + JKP archive) - the single read every build
// step (data files, SEO manifest, OG images) shares the shape of, so they all
// describe the same market/product universe. Throws on any failure.
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
  } catch (error) {
    // The JKP tab only exists once that scraper has run at least once, so a
    // *missing tab* (the Sheets API answers 400 "Unable to parse range") just
    // means no JKP data yet. Anything else - auth, quota, network, a 5xx - is
    // a real failure and must stop the build: swallowing it would publish a
    // site silently missing every JKP price.
    const isMissingTab = error?.code === 400 && /unable to parse range/i.test(String(error?.message ?? ''))
    if (!isMissingTab) throw error
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
