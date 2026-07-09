import { google } from 'googleapis'

const HEADER = [
  'Godina',
  'Nedelja',
  'NedeljaOpis',
  'Kategorija',
  'Mesto',
  'RBr',
  'Proizvod',
  'Velicina',
  'Pakovanje',
  'Poreklo',
  'JedMere',
  'CenaMin',
  'CenaMax',
  'CenaDom',
  'Trend',
  'Ponuda',
  'Komentar',
  'ScrapedAt',
]

// Columns that make a price row unique for a given scrape run - used to
// decide whether an incoming row updates an existing sheet row in place or
// gets appended as new.
const KEY_COLUMNS = ['Godina', 'Nedelja', 'Kategorija', 'Mesto', 'Proizvod', 'Velicina', 'Pakovanje', 'Poreklo']

function rowKey(row) {
  return KEY_COLUMNS.map((col) => row[col]).join('|')
}

function toSheetRow(row) {
  return HEADER.map((col) => row[col] ?? '')
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function ensureSheetExists(sheets, spreadsheetId, sheetName) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = data.sheets.some((s) => s.properties.title === sheetName)
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    })
  }
}

async function ensureHeader(sheets, spreadsheetId, sheetName) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:R1`,
  })
  const existing = data.values?.[0]
  if (!existing || existing.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    })
  }
}

// Upserts price rows: existing (year, week, category, market, product,
// size, packaging, origin) combinations are updated in place, everything
// else is appended. Re-running the scraper for a week you've already
// scraped refreshes prices instead of duplicating rows.
export async function upsertRows(rows) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Prices'
  if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set')

  const sheets = await getSheetsClient()
  await ensureSheetExists(sheets, spreadsheetId, sheetName)
  await ensureHeader(sheets, spreadsheetId, sheetName)

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:R`,
  })
  const existingRows = data.values || []
  const keyToRowNumber = new Map()
  existingRows.forEach((values, index) => {
    const existingRow = Object.fromEntries(HEADER.map((col, i) => [col, values[i]]))
    keyToRowNumber.set(rowKey(existingRow), index + 2) // +2: header row + 1-based index
  })

  const updates = []
  const appends = []
  for (const row of rows) {
    const key = rowKey(row)
    const rowNumber = keyToRowNumber.get(key)
    const values = toSheetRow(row)
    if (rowNumber) {
      updates.push({ range: `${sheetName}!A${rowNumber}:R${rowNumber}`, values: [values] })
    } else {
      appends.push(values)
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: updates },
    })
  }
  if (appends.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: appends },
    })
  }

  return { updated: updates.length, appended: appends.length }
}
