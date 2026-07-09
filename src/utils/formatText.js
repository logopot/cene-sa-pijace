// STIPS stores Poreklo values with no space before the parenthetical, e.g.
// "Uvoz(Turska)" - normalize for display without touching the raw dataset.
export function spaceBeforeParens(value) {
  if (!value) return value
  return value.replace(/\s*\(/g, ' (')
}
