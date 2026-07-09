import { google } from 'googleapis'

const HEADER = ['Date', 'City', 'Market', 'Category', 'Product', 'Price_Min', 'Price_Max', 'Price_Avg', 'Unit', 'Origin', 'Source']

// A row's archive identity - re-running the scraper for a date already
// written must not create duplicates.
const KEY_COLUMNS = ['Date', 'Market', 'Product']

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
    range: `${sheetName}!A1:K1`,
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

// Pure append-only archive: unlike the STIPS scraper's upsertRows (which
// updates matching rows in place), an existing (Date, Market, Product) row
// is never modified - re-running the scraper for a date already written
// just skips those rows, so the historical record stays immutable and
// duplicate-free.
export async function appendRows(rows) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = process.env.JKP_SHEET_NAME || 'JKP_Prices'
  if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set')

  const sheets = await getSheetsClient()
  await ensureSheetExists(sheets, spreadsheetId, sheetName)
  await ensureHeader(sheets, spreadsheetId, sheetName)

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:K`,
  })
  const existingKeys = new Set(
    (data.values || []).map((values) => rowKey(Object.fromEntries(HEADER.map((col, i) => [col, values[i]])))),
  )

  const toAppend = rows.filter((row) => !existingKeys.has(rowKey(row)))

  if (toAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: toAppend.map(toSheetRow) },
    })
  }

  return { appended: toAppend.length, skipped: rows.length - toAppend.length }
}
