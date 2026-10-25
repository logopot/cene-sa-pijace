// Loads the static datasets generated at build time by
// scripts/generate-data.mjs (the Google Sheet stays the source of truth - it
// is just read once per build instead of once per visitor). Rows come over
// the wire as { columns, rows: [[...]] } and are expanded here into the same
// row shape the UI always worked with.
const NUMERIC_COLUMNS = new Set(['CenaMin', 'CenaMax', 'CenaDom'])

// Columns the build intentionally leaves out because nothing in the UI reads
// them; kept on the record so the row shape stays identical to before.
const OMITTED_DEFAULTS = { Godina: null, Nedelja: null, RBr: null, ScrapedAt: '' }

let dataVersion = ''

export function expandRows({ columns, rows }) {
  return rows.map((values) => {
    const record = { ...OMITTED_DEFAULTS }
    columns.forEach((column, index) => {
      const value = values[index]
      record[column] = NUMERIC_COLUMNS.has(column) ? (typeof value === 'number' ? value : null) : (value ?? '')
    })
    return record
  })
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Data request failed (${res.status}): ${url}`)
  return res.json()
}

// Latest datapoints for every market/product - everything the homepage,
// market, city and category pages render.
export async function fetchLatestPrices() {
  const json = await getJson('/data/latest.json')
  dataVersion = json.version ?? ''
  return { rows: expandRows(json), generatedAt: json.generatedAt, version: dataVersion }
}

// Full history of one product family (see getFamilySlug in
// scripts/lib/dataset.mjs), loaded only when a product page needs its chart.
// The version query keeps a long-cached file from outliving a data refresh.
export async function fetchProductHistory(familySlug) {
  const query = dataVersion ? `?v=${encodeURIComponent(dataVersion)}` : ''
  const json = await getJson(`/data/products/${encodeURIComponent(familySlug)}.json${query}`)
  return expandRows(json)
}
