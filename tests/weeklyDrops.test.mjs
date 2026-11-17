import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeWeeklyDrops,
  pickWeeklyDrops,
  weekIndexOf,
  dropPercent,
  DROP_THRESHOLD,
  MAX_WEEKLY_DROPS,
} from '../src/utils/weeklyDrops.js'

// A STIPS-style row (weekly, dated by NedeljaOpis) or a JKP-style one (ISO Date).
const W = {
  43: '43. (19.10.2026-25.10.2026)',
  44: '44. (26.10.2026-01.11.2026)',
  45: '45. (02.11.2026-08.11.2026)',
  46: '46. (09.11.2026-15.11.2026)',
}
const stips = (proizvod, mesto, week, price, trend = '-') => ({
  Proizvod: proizvod,
  Mesto: mesto,
  Source: '',
  NedeljaOpis: W[week] ?? week,
  Date: '',
  CenaDom: price,
  Trend: trend,
  Velicina: '',
  Pakovanje: '',
  Poreklo: '',
})
const jkp = (proizvod, mesto, date, price, source = 'JKP Beogradske pijace') => ({
  ...stips(proizvod, mesto, '', price, ''),
  Source: source,
  NedeljaOpis: '',
  Date: date,
})
const names = (result) => result.drops.map((d) => d.row.Proizvod)

test('the Zlatibor example: no week 45 and Trend "rast" - it must not be listed', () => {
  const rows = [
    stips('Krave za klanje', 'Zlatiborski-klanica', 44, 330, 'rast'),
    stips('Krave za klanje', 'Zlatiborski-klanica', 46, 320, 'rast'),
    // another product in the same dataset keeps week 46 the current one
    stips('Kupus', 'Beograd-zelena pijaca', 45, 100),
    stips('Kupus', 'Beograd-zelena pijaca', 46, 80),
  ]
  const result = analyzeWeeklyDrops(rows)
  assert.deepEqual(names(result), ['Kupus'])
  assert.equal(result.rejected.noPreviousWeek, 1, 'week 44 is not "the week before" 46')
})

test('even with the Trend "pad", a gap week means no comparison with an older week', () => {
  const rows = [stips('Krave za klanje', 'Z-klanica', 44, 330, 'pad'), stips('Krave za klanje', 'Z-klanica', 46, 200, 'pad')]
  assert.deepEqual(pickWeeklyDrops(rows), [])
})

test('previous week present and a drop of 3% or more: listed with the computed change', () => {
  const rows = [stips('Paprika', 'Beograd-zelena pijaca', 45, 250), stips('Paprika', 'Beograd-zelena pijaca', 46, 150, 'pad')]
  const [drop] = pickWeeklyDrops(rows)
  assert.equal(drop.row.CenaDom, 150)
  assert.equal(drop.previousRow.CenaDom, 250)
  assert.ok(Math.abs(drop.change - -0.4) < 1e-9)
  assert.equal(dropPercent(drop.change), 40)
  // the source's own label does not decide: "-", empty and "bez promene" count by the computed change
  for (const trend of ['-', '', 'bez promene']) {
    const r = pickWeeklyDrops([stips('X', 'M', 45, 100), stips('X', 'M', 46, 90, trend)])
    assert.equal(r.length, 1, `trend "${trend}"`)
  }
})

test('threshold: exactly 3% qualifies, 2% does not', () => {
  assert.equal(DROP_THRESHOLD, -0.03)
  assert.equal(pickWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 97)]).length, 1)
  const two = analyzeWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 98)])
  assert.equal(two.drops.length, 0)
  assert.equal(two.rejected.belowThreshold, 1)
  assert.equal(pickWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 101)]).length, 0, 'a rise is no drop')
})

test('a rising source Trend rejects the card whatever the numbers say', () => {
  const result = analyzeWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 50, 'rast')])
  assert.equal(result.drops.length, 0)
  assert.equal(result.rejected.risingTrend, 1)
})

test('week before across a year end', () => {
  const dec = '52. (22.12.2025-28.12.2025)'
  const jan = '1. (29.12.2025-04.01.2026)'
  const rows = [stips('A', 'M', dec, 100), stips('A', 'M', jan, 80)]
  assert.equal(pickWeeklyDrops(rows).length, 1)
  // and two weeks apart over the year end is a gap
  assert.equal(pickWeeklyDrops([stips('A', 'M', '51. (15.12.2025-21.12.2025)', 100), stips('A', 'M', jan, 80)]).length, 0)
})

test('weekIndexOf: consecutive weeks differ by one (year end, daylight saving)', () => {
  const at = (y, m, d) => new Date(y, m - 1, d).getTime()
  assert.equal(weekIndexOf(at(2026, 1, 4)) + 1, weekIndexOf(at(2026, 1, 5)), 'Sunday | Monday')
  assert.equal(weekIndexOf(at(2025, 12, 29)), weekIndexOf(at(2026, 1, 4)), 'Monday and Sunday of one week')
  assert.equal(weekIndexOf(at(2026, 3, 23)) + 1, weekIndexOf(at(2026, 3, 30)), 'across the March clock change')
  assert.equal(weekIndexOf(at(2026, 10, 19)) + 1, weekIndexOf(at(2026, 10, 26)), 'across the October clock change')
})

test('sources and places are never mixed', () => {
  const rows = [
    // STIPS had last week's price, JKP has this week's: not comparable
    stips('Limun', 'Beograd-zelena pijaca', 45, 400),
    jkp('Limun', 'Beograd-zelena pijaca', '2026-11-12', 200),
    // same product, other market: not comparable
    stips('Kupus', 'Nis-zelena pijaca', 45, 100),
    stips('Kupus', 'Beograd-zelena pijaca', 46, 50),
    // another source name is another source
    jkp('Jabuka', 'Novi Sad-zelena pijaca', '2026-11-05', 100, 'JKP A'),
    jkp('Jabuka', 'Novi Sad-zelena pijaca', '2026-11-12', 50, 'JKP B'),
    // keeps week 46 the current STIPS week
    stips('Anchor', 'M', 46, 10),
  ]
  assert.deepEqual(pickWeeklyDrops(rows), [])
})

test('JKP: current week against the week before, whichever days were reported', () => {
  const rows = [
    jkp('Karfiol', 'Mirijevo-Beograd-zelena pijaca', '2026-11-05', 425),
    jkp('Karfiol', 'Mirijevo-Beograd-zelena pijaca', '2026-11-10', 300),
    jkp('Karfiol', 'Mirijevo-Beograd-zelena pijaca', '2026-11-12', 215),
  ]
  const [drop] = pickWeeklyDrops(rows)
  assert.equal(drop.row.CenaDom, 215, 'the latest record of the current week')
  assert.equal(drop.previousRow.CenaDom, 425)
})

test('records of an older week are not candidates (a market that stopped reporting)', () => {
  const rows = [
    stips('Stari', 'Selo-zelena pijaca', 43, 100),
    stips('Stari', 'Selo-zelena pijaca', 44, 50),
    stips('Anchor', 'M', 46, 10),
  ]
  assert.deepEqual(pickWeeklyDrops(rows), [])
})

test('size, packaging and origin keep products apart', () => {
  const a = { ...stips('Jaja', 'M', 45, 20), Velicina: 'L' }
  const b = { ...stips('Jaja', 'M', 46, 10), Velicina: 'M' }
  assert.deepEqual(pickWeeklyDrops([a, b]), [])
  assert.equal(pickWeeklyDrops([a, { ...b, Velicina: 'L' }]).length, 1)
})

test('sorted by the size of the drop; ties keep the data order', () => {
  const rows = []
  for (const [name, before, now] of [['Mala', 100, 90], ['Velika', 100, 50], ['Srednja', 100, 70], ['Srednja2', 100, 70]]) {
    rows.push(stips(name, 'M', 45, before), stips(name, 'M', 46, now))
  }
  assert.deepEqual(names({ drops: pickWeeklyDrops(rows) }), ['Velika', 'Srednja', 'Srednja2', 'Mala'])
})

test('at most 12 cards; fewer when fewer qualify; none when none do', () => {
  const many = []
  for (let i = 1; i <= 20; i += 1) many.push(stips(`P${i}`, 'M', 45, 100), stips(`P${i}`, 'M', 46, 100 - i * 2))
  const result = analyzeWeeklyDrops(many)
  assert.equal(MAX_WEEKLY_DROPS, 12)
  assert.equal(result.drops.length, 12)
  assert.equal(result.total, 19, 'P1 fell only 2%')
  assert.equal(result.drops[0].row.Proizvod, 'P20', 'the biggest drop first')

  const few = pickWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 80), stips('B', 'M', 45, 100), stips('B', 'M', 46, 100)])
  assert.equal(few.length, 1, 'never padded with products that are not drops')

  assert.deepEqual(pickWeeklyDrops([stips('A', 'M', 45, 100), stips('A', 'M', 46, 100)]), [])
  assert.deepEqual(pickWeeklyDrops([]), [])
})

test('the badge can never be "rast": nothing with that Trend reaches the list', () => {
  const rows = []
  for (let i = 0; i < 30; i += 1) {
    const trend = ['rast', 'pad', '-', '', 'bez promene'][i % 5]
    rows.push(stips(`P${i}`, 'M', 45, 100), stips(`P${i}`, 'M', 46, 60, trend))
  }
  const drops = pickWeeklyDrops(rows)
  assert.ok(drops.length > 0)
  for (const { row, change } of drops) {
    assert.notEqual(row.Trend, 'rast')
    assert.ok(change <= DROP_THRESHOLD)
  }
})
