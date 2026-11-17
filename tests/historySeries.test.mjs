import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHistorySeries, formatSeriesLabel, showsReferenceLine, seriesKindOf, REFERENCE_MARKET } from '../src/utils/historySeries.js'
import { translateDataValue } from '../scripts/lib/productLabels.mjs'

const JKP = 'JKP Beogradske pijace'
const row = (mesto, date, price, source = '') => ({
  Proizvod: 'Krompir',
  Mesto: mesto,
  Source: source,
  Date: date,
  NedeljaOpis: '',
  CenaDom: price,
})
const KALENIC = 'Kalenić-Beograd-zelena pijaca'
const KVANTAS = 'Beograd-kvantaška pijaca'
const ZVEZDARA = 'Zvezdara-Beograd-zelena pijaca'

// Same shape the page gets: the family's rows of every market and city.
const beograd = [
  row(KALENIC, '2026-11-05', 140, JKP),
  row(KALENIC, '2026-11-12', 142, JKP),
  row(ZVEZDARA, '2026-11-12', 300, JKP), // another JKP market: must NOT be averaged in
  row(KVANTAS, '2026-11-05', 74),
  row(KVANTAS, '2026-11-12', 75),
  row('Pirot-zelena pijaca', '2026-11-12', 90),
]

test('JKP market: its own line plus the wholesale market, each named market (source)', () => {
  const { series, history } = buildHistorySeries(beograd, 'Beograd', 'Kalenić')
  assert.deepEqual(series.map((s) => [s.role, s.pijaca, s.kind]), [
    ['selected', 'Kalenić', 'jkp'],
    ['reference', REFERENCE_MARKET, 'stips'],
  ])
  assert.deepEqual(series.map((s) => formatSeriesLabel(s.pijaca, s.kind)), ['Kalenić (JKP)', 'Kvantaška pijaca (STIPS)'])
  // the selected line is Kalenić alone (140/142), not the average of the city's JKP markets
  const [first, last] = history
  assert.equal(first[series[0].key], 140)
  assert.equal(last[series[0].key], 142)
  assert.equal(last[series[1].key], 75)
  assert.equal(history.length, 2, 'one point per reporting time, both lines on it')
  assert.ok(showsReferenceLine(series))
})

test('names follow the site: Serbian and English market names, short source in brackets', () => {
  const en = translateDataValue('en', 'pijaca', REFERENCE_MARKET)
  assert.equal(en, 'Wholesale Market')
  assert.equal(formatSeriesLabel(en, 'stips'), 'Wholesale Market (STIPS)')
  assert.equal(formatSeriesLabel(translateDataValue('sr', 'pijaca', REFERENCE_MARKET), 'stips'), 'Kvantaška pijaca (STIPS)')
  assert.equal(formatSeriesLabel('Kalenić', 'jkp'), 'Kalenić (JKP)')
  assert.equal(seriesKindOf(''), 'stips')
  assert.equal(seriesKindOf(undefined), 'stips')
  assert.equal(seriesKindOf(JKP), 'jkp')
})

test('STIPS market in a city with no wholesale market: one line, one name', () => {
  const { series } = buildHistorySeries(beograd, 'Pirot', 'Zelena pijaca')
  assert.deepEqual(series.map((s) => formatSeriesLabel(s.pijaca, s.kind)), ['Zelena pijaca (STIPS)'])
  assert.equal(showsReferenceLine(series), false)
})

test('the selected market is the wholesale market itself: one line', () => {
  const { series, history } = buildHistorySeries(beograd, 'Beograd', REFERENCE_MARKET)
  assert.deepEqual(series.map((s) => [s.role, formatSeriesLabel(s.pijaca, s.kind)]), [['selected', 'Kvantaška pijaca (STIPS)']])
  assert.equal(showsReferenceLine(series), false)
  assert.equal(history.length, 2)
})

test('a city with a wholesale market but no data for this product there: one line', () => {
  const rows = [row(KALENIC, '2026-11-12', 140, JKP)] // no Kvantaška row for the product
  const { series } = buildHistorySeries(rows, 'Beograd', 'Kalenić')
  assert.equal(series.length, 1)
  assert.equal(showsReferenceLine(series), false)
})

test('a wholesale market of another city is never the reference', () => {
  const rows = [row(KALENIC, '2026-11-12', 140, JKP), row('Niš-kvantaška pijaca', '2026-11-12', 60)]
  assert.equal(buildHistorySeries(rows, 'Beograd', 'Kalenić').series.length, 1)
})

test('a market reported by two sources shows two lines, each named for its source', () => {
  const rows = [row('Neka-Grad-zelena pijaca', '2026-11-05', 100), row('Neka-Grad-zelena pijaca', '2026-11-12', 80, JKP)]
  const { series } = buildHistorySeries(rows, 'Grad', 'Neka')
  assert.deepEqual(series.map((s) => formatSeriesLabel(s.pijaca, s.kind)), ['Neka (STIPS)', 'Neka (JKP)'])
})

test('no data for the selected market: only the reference line, none when there is nothing at all', () => {
  const only = buildHistorySeries(beograd, 'Beograd', 'Banjica')
  assert.deepEqual(only.series.map((s) => s.role), ['reference'])
  assert.equal(showsReferenceLine(only.series), false, 'a lone reference line needs no comparison note')
  assert.deepEqual(buildHistorySeries([], 'Beograd', 'Kalenić'), { series: [], history: [] })
})
