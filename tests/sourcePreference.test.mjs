import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  PREFERRED_SOURCE_BY_MARKET,
  applySourcePreference,
  describeSourcePreference,
  sourceKindOf,
} from '../src/data/sourcePreference.js'
import { analyzeWeeklyDrops } from '../src/utils/weeklyDrops.js'

const KALENIC = 'Kalenić-Beograd-zelena pijaca'
const SKADARLIJA = 'Skadarlija-Beograd-zelena pijaca'
const JKP = 'JKP Beogradske pijace'

const stips = (proizvod, mesto, price = 100, week = '46. (09.11.2026-15.11.2026)') => ({
  Proizvod: proizvod,
  Mesto: mesto,
  Source: '',
  NedeljaOpis: week,
  Date: '',
  CenaDom: price,
  Trend: '-',
})
const jkp = (proizvod, mesto, price = 100, date = '2026-11-12') => ({
  Proizvod: proizvod,
  Mesto: mesto,
  Source: JKP,
  NedeljaOpis: '',
  Date: date,
  CenaDom: price,
  Trend: '',
})

test('the rule names exactly the two overlapping markets, both preferring JKP', () => {
  assert.deepEqual(PREFERRED_SOURCE_BY_MARKET, { [KALENIC]: 'jkp', [SKADARLIJA]: 'jkp' })
  assert.equal(sourceKindOf(stips('A', 'M')), 'stips')
  assert.equal(sourceKindOf(jkp('A', 'M')), 'jkp')
})

test('a market with both sources keeps only the preferred one', () => {
  const rows = [
    stips('Krompir (beli)', KALENIC, 200),
    jkp('Krompir', KALENIC, 140),
    stips('Karfiol (sve sorte)', SKADARLIJA, 300),
    jkp('Karfiol', SKADARLIJA, 200),
  ]
  const result = applySourcePreference(rows)
  assert.deepEqual(result.rows.map((r) => `${r.Proizvod}|${r.Mesto}|${sourceKindOf(r)}`), [
    `Krompir|${KALENIC}|jkp`,
    `Karfiol|${SKADARLIJA}|jkp`,
  ])
  assert.deepEqual(result.removed, { [KALENIC]: 1, [SKADARLIJA]: 1 })
})

test('markets with one source are untouched, and no row of another market is lost', () => {
  const others = [
    stips('Malina', 'Beograd-kvantaška pijaca', 1300), // STIPS-only market
    stips('Kupus', 'Novi Sad-zelena pijaca'),
    jkp('Limun', 'Banjica-Beograd-zelena pijaca'), // JKP-only market
    jkp('Karfiol', 'Mirijevo-Beograd-zelena pijaca'),
  ]
  const rows = [...others, stips('Krompir (beli)', KALENIC), jkp('Krompir', KALENIC)]
  const result = applySourcePreference(rows)
  assert.equal(result.rows.length, others.length + 1)
  for (const row of others) assert.ok(result.rows.includes(row), `${row.Proizvod} / ${row.Mesto} must stay`)
  assert.deepEqual(result.overlapsWithoutRule, [])
})

test('a product only the non-preferred source has disappears - the other source is never a fill-in', () => {
  const rows = [stips('Paprika (Babura)', KALENIC, 250), stips('Jabuka (Ajdared)', KALENIC, 90), jkp('Krompir', KALENIC, 140)]
  const kept = applySourcePreference(rows).rows
  assert.deepEqual(kept.map((r) => r.Proizvod), ['Krompir'])
})

test('a rule never empties a market: with no row of the preferred source it is left alone', () => {
  const rows = [stips('Paprika (Babura)', KALENIC), stips('Kupus', KALENIC)]
  const result = applySourcePreference(rows)
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.skipped, [KALENIC])
  assert.ok(describeSourcePreference(result, 'x').some((line) => line.includes('WARNING')))
})

test('a new overlap without a rule is reported (and left as it is)', () => {
  const rows = [stips('Kupus', 'Novi Sad-zelena pijaca'), jkp('Kupus', 'Novi Sad-zelena pijaca')]
  const result = applySourcePreference(rows)
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.overlapsWithoutRule, ['Novi Sad-zelena pijaca'])
})

test('changing or removing the rule: a different winner, or no rule at all', () => {
  const rows = [stips('A', KALENIC), jkp('B', KALENIC)]
  assert.deepEqual(applySourcePreference(rows, { [KALENIC]: 'stips' }).rows.map((r) => r.Proizvod), ['A'])
  assert.equal(applySourcePreference(rows, {}).rows.length, 2)
})

test('the weekly-drops list never contains STIPS items of the two markets', () => {
  const rows = []
  for (const mesto of [KALENIC, SKADARLIJA]) {
    rows.push(stips('Krompir (beli)', mesto, 200, '45. (02.11.2026-08.11.2026)'), stips('Krompir (beli)', mesto, 100))
    rows.push(jkp('Krompir', mesto, 140, '2026-11-05'), jkp('Krompir', mesto, 100, '2026-11-12'))
  }
  const before = analyzeWeeklyDrops(rows).drops
  assert.ok(before.some((d) => d.row.Mesto === KALENIC && !d.row.Source), 'without the rule the STIPS card is there')
  const after = analyzeWeeklyDrops(applySourcePreference(rows).rows).drops
  assert.ok(after.length > 0)
  assert.ok(after.every((d) => d.row.Source === JKP), 'only JKP items of those markets')
})

test('generated data (when present): no STIPS row of the two markets in latest.json or any history', () => {
  const latest = new URL('../public/data/latest.json', import.meta.url)
  if (!existsSync(latest)) return
  const data = JSON.parse(readFileSync(latest, 'utf8'))
  const mesto = data.columns.indexOf('Mesto')
  const source = data.columns.indexOf('Source')
  const leaked = data.rows.filter((row) => row[mesto] in PREFERRED_SOURCE_BY_MARKET && !row[source])
  assert.equal(leaked.length, 0)
  const seen = new Set(data.rows.filter((row) => row[mesto] in PREFERRED_SOURCE_BY_MARKET).map((row) => row[source]))
  assert.deepEqual([...seen], [JKP], 'the markets are still there, JKP only')
})
