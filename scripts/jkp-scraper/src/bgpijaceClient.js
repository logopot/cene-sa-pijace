import * as cheerio from 'cheerio'
import { resolveMarketName, resolveProduct } from './cyrillic.js'

const USER_AGENT = 'Mozilla/5.0 (compatible; moja-pijaca-scraper/0.1)'

function baseUrl() {
  return process.env.JKP_BGPIJACE_BASE_URL || 'https://www.bgpijace.rs'
}

async function getHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) {
    throw new Error(`bgpijace.rs request failed (${res.status}): ${url}`)
  }
  return res.text()
}

// The barometar page's date <select> (Barcena[barometar_id]) drives which
// date's table is server-rendered - options come back newest-first, e.g.
// {id: "206", date: "2026-07-02"}.
export async function listBarometarDates() {
  const html = await getHtml(`${baseUrl()}/?page_id=58`)
  const $ = cheerio.load(html)
  return $('#Barcena_barometar_id option')
    .map((_, el) => ({ id: $(el).attr('value'), date: $(el).text().trim() }))
    .get()
}

function parsePriceRange(text) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const range = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/)
  if (range) {
    return { min: Number(range[1].replace(',', '.')), max: Number(range[2].replace(',', '.')) }
  }
  const single = Number(trimmed.replace(',', '.'))
  return Number.isNaN(single) ? null : { min: single, max: single }
}

// The page is a plain server-rendered form (GET /?page_id=58 with
// Barcena[barometar_id]=<id>) - confirmed by navigating directly to that
// URL with no JS involved, so no headless browser is needed here, same as
// the STIPS scraper's plain-fetch approach.
export async function fetchBarometarTable(barometarId) {
  const url = `${baseUrl()}/?page_id=58&${encodeURIComponent('Barcena[barometar_id]')}=${encodeURIComponent(barometarId)}&yt0=`
  const html = await getHtml(url)
  const $ = cheerio.load(html)

  const productHeaders = $('#tableBarometar thead th')
    .map((_, th) => $(th).text().trim())
    .get()
    .filter(Boolean)

  const rows = []
  $('#tableBarometar tbody tr').each((_, tr) => {
    const cells = $(tr).find('td')
    const marketCyrillic = $(cells[0]).text().trim()
    if (!marketCyrillic) return
    const market = resolveMarketName(marketCyrillic)

    productHeaders.forEach((productCyrillic, i) => {
      const cellText = $(cells[i + 1]).text().trim()
      const range = parsePriceRange(cellText)
      if (!range) return // market didn't report this product that day
      const product = resolveProduct(productCyrillic)
      rows.push({
        market,
        category: product.category,
        product: product.name,
        priceMin: range.min,
        priceMax: range.max,
      })
    })
  })

  return rows
}
