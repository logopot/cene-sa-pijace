import 'dotenv/config'
import { google } from 'googleapis'

// One-time correction for JKP_Prices rows already written under the old,
// STIPS-mismatched product names (see cyrillic.js's PRODUCTS map, fixed
// alongside this script) - renames only the Product cell in place, leaving
// every other column untouched, so the (Date, Market, Product) rows now
// line up with the same base family useProductAnalytics.js's
// normalizeProductName resolves for their STIPS counterparts.
const RENAMES = {
  'Mladi crni luk': 'Luk crni (mladi)',
  'Mladi beli luk': 'Luk beli (mladi)',
  'Crni Luk': 'Luk crni',
  'Plavi Patlidžan': 'Patlidžan',
}

const PRODUCT_COLUMN_INDEX = 4 // 0-based: Date, City, Market, Category, Product, ...

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function run() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = process.env.JKP_SHEET_NAME || 'JKP_Prices'
  if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set')

  const sheets = await getSheetsClient()
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:K`,
  })
  const rows = data.values || []

  const updates = []
  const counts = {}
  rows.forEach((row, i) => {
    const oldName = row[PRODUCT_COLUMN_INDEX]
    const newName = RENAMES[oldName]
    if (!newName) return
    const rowNumber = i + 2 // +1 for the header row, +1 for 1-based sheet rows
    updates.push({ range: `${sheetName}!E${rowNumber}`, values: [[newName]] })
    counts[oldName] = (counts[oldName] ?? 0) + 1
  })

  if (updates.length === 0) {
    console.log('No rows found using the old mismatched product names. Nothing to do.')
    return
  }

  console.log(`Renaming ${updates.length} row(s):`, counts)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'RAW', data: updates },
  })
  console.log(`Done. Renamed ${updates.length} row(s).`)
}

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
