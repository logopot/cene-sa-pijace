// STIPS stores Poreklo values with no space before the parenthetical, e.g.
// "Uvoz(Turska)" - normalize for display without touching the raw dataset.
export function spaceBeforeParens(value) {
  if (!value) return value
  return value.replace(/\s*\(/g, ' (')
}

// Category labels are capitalized as standalone dropdown options (see
// categories.* in translation.json), but read as common nouns when embedded
// mid-sentence (e.g. "Aktuelne cene za jaja..."), so headings lowercase the
// leading letter for display without touching the translation source.
export function lowercaseFirst(value) {
  if (!value) return value
  return value.charAt(0).toLowerCase() + value.slice(1)
}
