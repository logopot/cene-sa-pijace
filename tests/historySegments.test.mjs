import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHistorySeries, maxGapDays, segmentIndices, selectHoverPoints } from '../src/utils/historySeries.js'
import { FRESH_DAYS_JKP, FRESH_WEEKS_STIPS } from '../src/data/freshness.js'

const DAY = 24 * 60 * 60 * 1000
const day = (iso) => Date.parse(`${iso}T00:00:00Z`)
const JKP = 'JKP Beogradske pijace'

test('the gap limits are the freshness limits', () => {
  assert.equal(maxGapDays('jkp'), FRESH_DAYS_JKP)
  assert.equal(maxGapDays('stips'), FRESH_WEEKS_STIPS * 7)
})

test('segments: no gap, gap exactly at the limit (bridged), one day over (cut)', () => {
  const at = (...isos) => isos.map(day)
  // no gap
  assert.deepEqual(segmentIndices([0, 1, 2], at('2026-11-05', '2026-11-12', '2026-11-19'), 'jkp'), [[0, 1, 2]])
  // exactly 21 days: still one line; 22: two
  assert.deepEqual(segmentIndices([0, 1], at('2026-10-01', '2026-10-22'), 'jkp'), [[0, 1]])
  assert.deepEqual(segmentIndices([0, 1], at('2026-10-01', '2026-10-23'), 'jkp'), [[0], [1]])
  // STIPS: 3 weeks bridged, 3 weeks + a day cut
  assert.deepEqual(segmentIndices([4, 9], at('2026-10-05', '2026-10-26'), 'stips'), [[4, 9]])
  assert.deepEqual(segmentIndices([4, 9], at('2026-10-05', '2026-10-27'), 'stips'), [[4], [9]])
  // nothing, and a single record
  assert.deepEqual(segmentIndices([], [], 'jkp'), [])
  assert.deepEqual(segmentIndices([3], at('2026-07-02'), 'jkp'), [[3]])
})

test('segments: a gap over the year end is measured in days, not in calendar years', () => {
  const at = (...isos) => isos.map(day)
  assert.deepEqual(segmentIndices([0, 1], at('2025-12-20', '2026-01-10'), 'jkp'), [[0, 1]], '21 days across the new year')
  assert.deepEqual(segmentIndices([0, 1], at('2025-12-19', '2026-01-10'), 'jkp'), [[0], [1]], '22 days')
  assert.deepEqual(segmentIndices([0, 1], at('2025-12-29', '2026-01-19'), 'stips'), [[0, 1]])
})

test('segments: a daylight-saving hour does not cut a line (local-midnight STIPS times)', () => {
  const before = new Date(2026, 2, 23).getTime() // local midnights around the March clock change
  const after = new Date(2026, 3, 13).getTime() // 21 calendar days later, 20 days 23 hours or 21 days 1 hour apart
  assert.deepEqual(segmentIndices([0, 1], [before, after], 'stips'), [[0, 1]])
})

const row = (mesto, date, price, source = '') => ({ Proizvod: 'Karfiol', Mesto: mesto, Source: source, Date: date, NedeljaOpis: '', CenaDom: price })
const MIRIJEVO = 'Mirijevo-Beograd-zelena pijaca'
const KVANTAS = 'Beograd-kvantaška pijaca'

test('Mirijevo-style data: an isolated July record, a gap, then a weekly line', () => {
  const rows = [
    row(MIRIJEVO, '2026-07-02', 325, JKP),
    row(MIRIJEVO, '2026-10-08', 400, JKP),
    row(MIRIJEVO, '2026-10-15', 410, JKP),
    row(MIRIJEVO, '2026-10-22', 420, JKP),
    ...['2026-06-29', '2026-07-27', '2026-09-28', '2026-11-09'].map((d) => row(KVANTAS, d, 80)),
  ]
  const { series, history } = buildHistorySeries(rows, 'Beograd', 'Mirijevo')
  const blue = series[0]
  assert.equal(blue.kind, 'jkp')
  assert.equal(blue.segments.length, 2)
  assert.equal(blue.segments[0].isolated, true)
  assert.equal(blue.segments[1].isolated, false)
  assert.equal(history[blue.segments[0].indices[0]].time, day('2026-07-02'))
  assert.equal(history[blue.segments[1].indices[0]].time, day('2026-10-08'))
  // each segment has its own data key and holds values only for its own records
  assert.equal(history[blue.segments[0].indices[0]][blue.segments[0].dataKey], 325)
  assert.equal(history[blue.segments[1].indices[0]][blue.segments[0].dataKey], undefined)
  // the green (STIPS) records are 4+ weeks apart: four lone records
  const green = series[1]
  assert.equal(green.segments.length, 4)
  assert.ok(green.segments.every((segment) => segment.isolated))
})

// ---- which point the cursor is over ----------------------------------------------

// A tiny chart: index i is at x = 10 * i; a price v is at y = 400 - v.
const scales = { xOf: (i) => i * 10, yOf: (v) => 400 - v }

function chart() {
  // data: index -> values per series key
  const history = []
  const put = (i, key, value) => {
    history[i] = { ...(history[i] ?? {}), [key]: value }
  }
  for (let i = 0; i <= 20; i += 1) history[i] = {}
  // blue: a lone record at 2, then a line over 10..20 (records at 10, 14, 20)
  put(2, 'blue', 100)
  for (const [i, v] of [[10, 150], [14, 170], [20, 190]]) put(i, 'blue', v)
  // green: records at 0, 4, 8, 12, 16, 20 (a line over the whole chart)
  for (const [i, v] of [[0, 60], [4, 70], [8, 80], [12, 90], [16, 95], [20, 190]]) put(i, 'green', v)
  const series = [
    { key: 'blue', segments: [{ dataKey: 'blue#0', indices: [2], isolated: true }, { dataKey: 'blue#1', indices: [10, 14, 20], isolated: false }] },
    { key: 'green', segments: [{ dataKey: 'green#0', indices: [0, 4, 8, 12, 16, 20], isolated: false }] },
  ]
  return { history, series }
}
const pick = (cursor, over = {}) => {
  const { history, series } = chart()
  return selectHoverPoints({ series, cursor, valueAt: (i, key) => history[i][key], ...scales, ...over })
}

test('the cursor on a line shows that series, at the record nearest in x', () => {
  // x = 130 (between blue records 10 and 14), y on the blue line (~ 400-160 = 240)
  assert.deepEqual(pick({ x: 130, y: 240 }), [{ key: 'blue', index: 14, value: 170 }])
  // on the green line at x = 70 (between records 4 and 8, nearer to 8), y = 400 - 77.5
  assert.deepEqual(pick({ x: 70, y: 322 }), [{ key: 'green', index: 8, value: 80 }])
  assert.deepEqual(pick({ x: 50, y: 328 }), [{ key: 'green', index: 4, value: 70 }])
})

test('no sticking: the date follows the cursor from record to record', () => {
  const dates = []
  for (let x = 0; x <= 200; x += 10) {
    const picked = pick({ x, y: 400 - 75 })
    if (picked.length > 0) dates.push(picked[0].index)
  }
  assert.deepEqual([...dates].sort((a, b) => a - b), dates)
  assert.ok(new Set(dates).size >= 5)
})

test('in a gap of a series that series is not shown, and the other one is not forced on the cursor', () => {
  // x = 50..90: blue has nothing (the gap between its lone record and its line)
  for (const x of [40, 60, 80, 95]) {
    const picked = pick({ x, y: 400 - 100 })
    assert.equal(picked.some((p) => p.key === 'blue'), false, `x=${x}`)
  }
  // x beyond every line of a series: nothing of that series (green ends at 200)
  assert.deepEqual(pick({ x: 260, y: 300 }), [])
  // x before everything
  assert.deepEqual(pick({ x: -30, y: 300 }), [])
})

test('the series whose line is closest vertically wins where both lines are under the cursor', () => {
  // at x = 150..160 both blue (~170-190) and green (~90-95) have lines: y picks
  assert.equal(pick({ x: 145, y: 400 - 172 })[0].key, 'blue')
  assert.equal(pick({ x: 145, y: 400 - 91 })[0].key, 'green')
})

test('both series are shown only when both have a record at the very same position', () => {
  // index 20: blue 190 and green 190 at the same date
  const both = pick({ x: 200, y: 400 - 190 })
  assert.deepEqual(both.map((p) => p.key), ['blue', 'green'])
  assert.ok(both.every((p) => p.index === 20))
  // index 14 has only blue; green's nearest record (12 or 16) is another date: not shown
  assert.deepEqual(pick({ x: 140, y: 400 - 170 }).map((p) => p.key), ['blue'])
})

test('an isolated record is hoverable only on the dot itself', () => {
  assert.deepEqual(pick({ x: 20, y: 400 - 100 }), [{ key: 'blue', index: 2, value: 100 }])
  assert.deepEqual(pick({ x: 30, y: 300 }).map((p) => p.key).filter((k) => k === 'blue'), [], '10 pixels away is already the gap')
})
