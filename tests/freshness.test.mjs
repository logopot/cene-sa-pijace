import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  FRESH_DAYS_JKP,
  FRESH_WEEKS_STIPS,
  computeReference,
  listingStatus,
  isFreshRow,
  isFreshDay,
  rowDay,
  formatDay,
  formatDayShort,
  lastPriceLabel,
  referenceAgeDays,
} from '../src/data/freshness.js'
import { computeCityComparison, buildProductJsonLd } from '../src/utils/productJsonLd.js'
import { productCopy, manifestEntryCopy, staleListingDescription } from '../src/utils/seoCopy.js'
import { productFacts } from '../src/utils/seoFacts.js'
import { analyzeWeeklyDrops } from '../src/utils/weeklyDrops.js'


const JKP = 'JKP Beogradske pijace'
const jkp = (mesto, date, price = 100, proizvod = 'Krompir') => ({ Proizvod: proizvod, Mesto: mesto, Source: JKP, Date: date, NedeljaOpis: '', CenaDom: price, CenaMin: price, CenaMax: price, Trend: '' })
const stips = (mesto, week, price = 100, proizvod = 'Krompir') => ({ Proizvod: proizvod, Mesto: mesto, Source: '', Date: '', NedeljaOpis: week, CenaDom: price, CenaMin: price, CenaMax: price, Trend: '-' })
// STIPS weeks (Monday-Sunday): 46 = 09.11.-15.11.2026, each earlier one 7 days before.
const WEEK = {
  46: '46. (09.11.2026-15.11.2026)',
  45: '45. (02.11.2026-08.11.2026)',
  44: '44. (26.10.2026-01.11.2026)',
  43: '43. (19.10.2026-25.10.2026)',
  42: '42. (12.10.2026-18.10.2026)',
}

test('the reference is the newest date of each source in the data - not the clock', () => {
  const rows = [jkp('A-G-zelena pijaca', '2026-11-05'), jkp('B-G-zelena pijaca', '2026-11-12'), stips('C-G-zelena pijaca', WEEK[45]), stips('D-G-zelena pijaca', WEEK[46])]
  assert.deepEqual(computeReference(rows), { jkp: '2026-11-12', stipsWeek: '2026-11-09' })
  assert.deepEqual(computeReference([]), { jkp: null, stipsWeek: null })
  assert.deepEqual(computeReference([stips('C', WEEK[46])]), { jkp: null, stipsWeek: '2026-11-09' })
  // The same data gives the same answer whatever "now" is.
  const original = Date.now
  Date.now = () => Date.parse('2030-01-01T00:00:00Z')
  try {
    assert.deepEqual(computeReference(rows), { jkp: '2026-11-12', stipsWeek: '2026-11-09' })
  } finally {
    Date.now = original
  }
  // ...and "how old is the reference" is a separate, explicit question (build warning).
  const age = referenceAgeDays({ jkp: '2026-11-12', stipsWeek: '2026-11-09' }, Date.parse('2026-11-27T12:00:00Z'))
  assert.deepEqual(age, { jkp: 15, stips: 12 }, 'the STIPS week counts to its Sunday, 15.11.')
})

test('JKP threshold: 21 days is fresh, 22 is stale', () => {
  assert.equal(FRESH_DAYS_JKP, 21)
  const reference = { jkp: '2026-11-12', stipsWeek: '2026-11-09' }
  assert.equal(isFreshRow(jkp('M', '2026-11-12'), reference), true)
  assert.equal(isFreshRow(jkp('M', '2026-10-22'), reference), true, '21 days')
  assert.equal(isFreshRow(jkp('M', '2026-10-21'), reference), false, '22 days')
})

test('STIPS threshold: the newest week minus 3 is fresh, minus 4 is stale', () => {
  assert.equal(FRESH_WEEKS_STIPS, 3)
  const reference = { jkp: '2026-11-12', stipsWeek: '2026-11-09' }
  assert.equal(isFreshRow(stips('M', WEEK[46]), reference), true)
  assert.equal(isFreshRow(stips('M', WEEK[45]), reference), true, 'week -1')
  assert.equal(isFreshRow(stips('M', WEEK[44]), reference), true, 'week -2')
  assert.equal(isFreshRow(stips('M', WEEK[43]), reference), true, 'week -3: markets that report every 3-4 weeks stay current')
  assert.equal(isFreshRow(stips('M', WEEK[42]), reference), false, 'week -4')
})

test('weeks count across a year end', () => {
  const reference = { jkp: '2026-01-07', stipsWeek: '2026-01-05' } // week of 05.01.2026
  assert.equal(isFreshRow(stips('M', '1. (29.12.2025-04.01.2026)'), reference), true, 'week -1, previous year')
  assert.equal(isFreshRow(stips('M', '52. (22.12.2025-28.12.2025)'), reference), true, 'week -2')
  assert.equal(isFreshRow(stips('M', '51. (15.12.2025-21.12.2025)'), reference), true, 'week -3')
  assert.equal(isFreshRow(stips('M', '50. (08.12.2025-14.12.2025)'), reference), false, 'week -4')
  assert.equal(isFreshRow(jkp('M', '2025-12-17'), reference), true, '21 days over the year end')
  assert.equal(isFreshRow(jkp('M', '2025-12-16'), reference), false, '22 days')
})

test('each source is judged against its own newest data', () => {
  // JKP data is far newer than STIPS: a STIPS record is not stale because of JKP's date.
  const reference = { jkp: '2026-11-30', stipsWeek: '2026-11-09' }
  assert.equal(isFreshRow(stips('M', WEEK[46]), reference), true)
  assert.equal(isFreshRow(jkp('M', '2026-11-30'), reference), true)
  assert.equal(isFreshDay(null, 'jkp', reference), false, 'a row without a date is not fresh')
})

test('record dates: the day of a record, formatted dd.mm.yyyy (short dd.mm.)', () => {
  assert.equal(lastPriceLabel(jkp('M', '2026-09-24')), '24.09.2026')
  assert.equal(lastPriceLabel(jkp('M', '2026-09-24'), { short: true }), '24.09.')
  assert.equal(lastPriceLabel(stips('M', WEEK[46])), '15.11.2026', 'a STIPS week counts by its Sunday')
  assert.equal(formatDay(rowDay(jkp('M', '2026-01-05'))), '05.01.2026')
  assert.equal(formatDayShort(rowDay(jkp('M', '2026-01-05'))), '05.01.')
})

test('computed ranges come from fresh rows only', () => {
  const reference = { jkp: '2026-11-12', stipsWeek: '2026-11-09' }
  const rows = [
    jkp('Kalenić-Beograd-zelena pijaca', '2026-11-12', 140),
    jkp('Zvezdara-Beograd-zelena pijaca', '2026-07-02', 900), // stale, huge: must not be the highest price
    stips('Pirot-zelena pijaca', WEEK[46], 90),
    stips('Niš-zelena pijaca', WEEK[42], 5), // stale, tiny: must not be the lowest
  ]
  const fresh = (row) => isFreshRow(row, reference)
  const cities = computeCityComparison(rows, fresh)
  assert.deepEqual(cities.map((c) => [c.grad, c.price]), [['Pirot', 90], ['Beograd', 140]])
  const withStale = computeCityComparison(rows)
  assert.deepEqual(withStale[0], { grad: 'Niš', price: 5 }, 'without the filter the stale row would be the lowest price')
  const ld = buildProductJsonLd({ name: 'Krompir', category: 'Povrće', cityComparison: cities })
  assert.equal(ld.offers.lowPrice, 90)
  assert.equal(ld.offers.highPrice, 140)
  assert.equal(ld.offers.offerCount, 2)
})

test('weekly drops never contain a stale product', () => {
  // Same product at two markets: one current (week 46 vs 45), one whose newest week is long gone.
  const rows = [
    stips('A-G-zelena pijaca', WEEK[45], 100),
    stips('A-G-zelena pijaca', WEEK[46], 50),
    stips('B-G-zelena pijaca', '30. (20.07.2026-26.07.2026)', 100),
    stips('B-G-zelena pijaca', '31. (27.07.2026-02.08.2026)', 50),
  ]
  const { drops } = analyzeWeeklyDrops(rows)
  assert.deepEqual(drops.map((d) => d.row.Mesto), ['A-G-zelena pijaca'])
  const reference = computeReference(rows)
  for (const { row } of drops) assert.equal(isFreshRow(row, reference), true)
})

// ---- SEO ---------------------------------------------------------------------

const facts = (over = {}) => ({ name: 'Lubenica', market: 'Kalenić', city: 'Beograd', min: 80, max: 120, unit: 'kg', source: JKP, date: '24.09.2026.', variant: '', stale: false, lastDate: '24.09.2026', ...over })

test('stale copy: same title, no "current price" claim, last recorded price and date', () => {
  const fresh = productCopy('sr', facts())
  const stale = productCopy('sr', facts({ stale: true }))
  assert.equal(stale.title, fresh.title, 'the title keeps its form')
  assert.equal(stale.title, 'Lubenica cena – Kalenić Beograd')
  assert.equal(stale.description, 'Lubenica, Kalenić Beograd: Nema aktuelnih podataka. Poslednja zabeležena cena: 80–120 RSD/kg (24.09.2026).')
  const en = productCopy('en', facts({ name: 'Watermelon', stale: true }))
  assert.equal(en.title, 'Watermelon price – Kalenić (Beograd)')
  assert.equal(en.description, 'Watermelon, Kalenić, Beograd: No current data. Last recorded price: 80–120 RSD per kg (24.09.2026).')
  assert.equal(productCopy('sr', facts({ stale: true, max: 80 })).description.includes('80 RSD/kg'), true, 'one price, not a range')
  for (const copy of [stale, en]) {
    assert.doesNotMatch(copy.title + ' ' + copy.description, /aktuelna cena|trenutna cena|current price|latest price|danas|today/i)
    assert.ok(copy.title.length <= 60)
    assert.ok(copy.description.length <= 155)
  }
  // A fresh page is exactly what it was.
  assert.match(fresh.description, /^Lubenica: aktuelna cena od 80 do 120 RSD \(kg\) na pijaci Kalenić Beograd/)
})

test('stale copy of long names stays within 60 / 155 characters', () => {
  const long = productCopy('sr', facts({ name: 'Kukuruz (novi rod, okrunjen, veštački sušen)', market: 'Otkupna mesta / Klanice', city: 'Južnobanatski okrug', stale: true }))
  assert.ok(long.title.length <= 60)
  assert.ok(long.description.length <= 155)
})

test('manifest entries: stale flag and last date drive the copy; fresh entries are unchanged', () => {
  const entry = { type: 'product', lang: 'sr', name: 'Lubenica', mk: 'Kalenić', ct: 'Beograd', pr: [80, 120], un: 'kg', sr: JKP, dt: '24.09.2026.' }
  assert.match(manifestEntryCopy(entry).description, /^Lubenica: aktuelna cena/)
  const stale = manifestEntryCopy({ ...entry, st: 1, lp: '24.09.2026' })
  assert.match(stale.description, /Nema aktuelnih podataka\. Poslednja zabeležena cena: 80–120 RSD\/kg \(24\.09\.2026\)\./)
})

test('productFacts reports staleness against the reference (none without one)', () => {
  const rows = [jkp('Kalenić-Beograd-zelena pijaca', '2026-09-24', 120, 'Lubenica')]
  const match = () => true
  const reference = { jkp: '2026-11-12', stipsWeek: '2026-11-09' }
  const stale = productFacts(rows, match, 'x', reference)
  assert.equal(stale.stale, true)
  assert.equal(stale.lastDate, '24.09.2026')
  assert.equal(productFacts(rows, match, 'x').stale, false, 'no reference, nothing is stale')
  assert.equal(productFacts([jkp('M', '2026-11-12', 1, 'X')], match, 'x', reference).stale, false)
})

test('generated data (when present): latest.json carries the reference, equal to what the rows give', () => {
  const file = new URL('../public/data/latest.json', import.meta.url)
  if (!existsSync(file)) return
  const data = JSON.parse(readFileSync(file, 'utf8'))
  assert.match(data.reference.jkp, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(data.reference.stipsWeek, /^\d{4}-\d{2}-\d{2}$/)
  const rows = data.rows.map((values) => Object.fromEntries(data.columns.map((c, i) => [c, values[i]])))
  assert.deepEqual(computeReference(rows), data.reference)
})

test('generated manifest (when present): stale pages stay indexed and in the sitemap; pages with no data keep noindex', async () => {
  const manifestFile = new URL('../functions/lib/seo-manifest.mjs', import.meta.url)
  const sitemapFile = new URL('../public/sitemap.xml', import.meta.url)
  if (!existsSync(manifestFile) || !existsSync(sitemapFile)) return
  const { SEO_MANIFEST: manifest } = await import(manifestFile.href)
  const sitemap = readFileSync(sitemapFile, 'utf8')
  const products = Object.entries(manifest).filter(([, entry]) => entry.type === 'product')
  const stale = products.filter(([, entry]) => entry.st)
  assert.ok(stale.length > 0)
  for (const [path, entry] of stale) {
    assert.equal(entry.noindex, undefined, `${path} must not be noindex`)
    assert.ok(entry.pr && entry.lp, `${path} has its last price and date`)
    assert.equal(sitemap.includes(`<loc>https://cenesapijace.org${path}</loc>`), true, `${path} stays in the sitemap`)
  }
  for (const [path, entry] of products.filter(([, entry]) => !entry.pr)) {
    assert.equal(entry.noindex, 1, `${path} has no data at all: noindex as before`)
    assert.equal(sitemap.includes(`<loc>https://cenesapijace.org${path}</loc>`), false)
  }
  // sr and en pairs agree
  for (const [path, entry] of stale) {
    const other = entry.alt && manifest[Object.values(entry.alt)[0]]
    if (other) assert.equal(Boolean(other.st), true, `${path} and its pair are both stale`)
  }
})

test('a whole list is stale only when not one product in it is fresh', () => {
  const reference = { jkp: '2026-11-12', stipsWeek: '2026-11-09' }
  const old = [stips('M', WEEK[42]), stips('M', '38. (14.09.2026-20.09.2026)')]
  assert.deepEqual(listingStatus(old, reference), { noFresh: true, lastReport: '18.10.2026' })
  assert.deepEqual(listingStatus([...old, stips('M', WEEK[46])], reference), { noFresh: false, lastReport: '' })
  assert.deepEqual(listingStatus([], reference), { noFresh: false, lastReport: '' }, 'an empty list is empty, not stale')
  assert.deepEqual(listingStatus(old, null), { noFresh: false, lastReport: '' }, 'no reference: nothing is stale')
})

test('description of a market or category with a whole stale list: no claim of current prices', () => {
  const market = staleListingDescription({ lang: 'sr', kind: 'market', market: 'Zelena pijaca', city: 'Sombor', lastReport: '18.10.2026' })
  assert.equal(market, 'Zelena pijaca, Sombor: Nema aktuelnih podataka. Poslednja prijava: 18.10.2026.')
  const marketEn = staleListingDescription({ lang: 'en', kind: 'market', market: 'Green Market', city: 'Sombor', lastReport: '18.10.2026' })
  assert.equal(marketEn, 'Green Market, Sombor: No current data. Last report: 18.10.2026.')
  const category = staleListingDescription({ lang: 'sr', kind: 'category', market: 'Zelena pijaca', city: 'Sombor', category: 'Povrće', lastReport: '18.10.2026' })
  assert.equal(category, 'Sombor • Zelena pijaca • Povrće. Nema aktuelnih podataka. Poslednja prijava: 18.10.2026.')
  const categoryEn = staleListingDescription({ lang: 'en', kind: 'category', market: 'Green Market', city: 'Sombor', category: 'Vegetables', lastReport: '18.10.2026' })
  assert.equal(categoryEn, 'Sombor • Green Market • Vegetables. No current data. Last report: 18.10.2026.')
  // the city already in the market's name is not repeated
  assert.equal(staleListingDescription({ lang: 'sr', kind: 'market', market: 'TC Novi Beograd', city: 'Beograd', lastReport: '01.01.2026' }), 'TC Novi Beograd: Nema aktuelnih podataka. Poslednja prijava: 01.01.2026.')
  for (const text of [market, marketEn, category, categoryEn]) {
    assert.ok(text.length <= 155)
    assert.doesNotMatch(text, /aktuelne cene|aktuelna cena|current price|fresh/i)
  }
})

test('generated manifest (when present): stale-list markets and categories stay indexed, canonical/hreflang untouched', async () => {
  const manifestFile = new URL('../functions/lib/seo-manifest.mjs', import.meta.url)
  const sitemapFile = new URL('../public/sitemap.xml', import.meta.url)
  if (!existsSync(manifestFile) || !existsSync(sitemapFile)) return
  const { SEO_MANIFEST: manifest } = await import(manifestFile.href)
  const sitemap = readFileSync(sitemapFile, 'utf8')
  const listings = Object.entries(manifest).filter(([, entry]) => (entry.type === 'market' || entry.type === 'category') && entry.ns)
  assert.ok(listings.length > 0)
  for (const [path, entry] of listings) {
    assert.equal(entry.noindex, undefined, `${path} must not be noindex`)
    assert.match(entry.lr, /^\d{2}\.\d{2}\.\d{4}$/)
    if (!entry.canonicalPath || entry.canonicalPath === path) {
      assert.equal(sitemap.includes(`<loc>https://cenesapijace.org${path}</loc>`), true, `${path} stays in the sitemap`)
    }
    const other = entry.alt && manifest[Object.values(entry.alt)[0]]
    if (other) assert.equal(Boolean(other.ns), true, `${path} and its pair agree`)
  }
})
