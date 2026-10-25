// Placeholders the sources use for "no value here" - STIPS writes "-" (or an
// em dash) for attributes it doesn't report, and a blank cell comes through as
// an empty string. Presentation-only: nothing is ever substituted for them.
const BLANK_PLACEHOLDERS = new Set(['', '-', '—', '–', 'n/a', 'na'])

export function isBlank(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return Number.isNaN(value)
  return BLANK_PLACEHOLDERS.has(String(value).trim().toLowerCase())
}
