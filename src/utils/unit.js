// STIPS leaves JedMere (unit of measure) and Pakovanje (packaging) blank for
// a large share of livestock/animal-for-slaughter rows (Bikovi, Tovljenici,
// Jagnjad, etc. - all filed under Kategorija "Meso"), even though those
// products are always sold by the kilogram. The database value always wins
// when present - this only fills the gap, and only for that one category,
// so a future correction to the sheet is picked up automatically with no
// conflict.
const LIVESTOCK_CATEGORY = 'Meso'
const LIVESTOCK_FALLBACK_UNIT = 'kg'

function isValidUnit(value) {
  return typeof value === 'string' && value.trim() !== '' && value.trim() !== '-'
}

export function resolveUnit(rawValue, kategorija) {
  if (isValidUnit(rawValue)) return rawValue
  if (kategorija === LIVESTOCK_CATEGORY) return LIVESTOCK_FALLBACK_UNIT
  return ''
}
