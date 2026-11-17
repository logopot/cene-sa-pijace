// Markets that two sources report on (STIPS and a JKP) show ONE of them only: the
// two disagree widely on the price of the same product (Kalenić potatoes: JKP 140,
// STIPS 200), and showing both side by side - or mixing them in one chart - would
// be a coin toss for the visitor. The rule lives here and nowhere else.
//
// Key: the row's Mesto exactly as the sheet writes it. Value: the preferred source,
// "jkp" (a row with a Source: JKP Beogradske pijace, ...) or "stips" (a row with no
// Source). Applied once, when the data files are generated
// (scripts/generate-data.mjs for latest.json, product histories and snapshots;
// scripts/generate-seo-map.mjs for the prices behind titles/descriptions/noindex).
// The Google sheet and the scrapers are untouched - the other source's rows stay
// stored there and simply do not reach the site.
//
// To add a market: add a line. To change the winner: change the value. To stop
// preferring (show both again): delete the line - or empty the object. Rebuild
// afterwards. The build warns about any market that has both sources but no line
// here, so a new overlap does not go unnoticed.
export const PREFERRED_SOURCE_BY_MARKET = {
  'Kalenić-Beograd-zelena pijaca': 'jkp',
  'Skadarlija-Beograd-zelena pijaca': 'jkp',
}

// STIPS rows carry no Source (see sheetsService.js / googleSheets.mjs); every row
// with one is from a municipal operator's archive ("jkp" here).
export function sourceKindOf(row) {
  return row.Source ? 'jkp' : 'stips'
}

// Drops, for each market named in `preferences`, the rows of the source that is
// NOT preferred. Markets not named are returned untouched, and so is a named
// market that has no row of the preferred source at all (so a rule can never
// empty a market). A product the preferred source does not report simply has no
// rows left - the other source is never used as a fill-in.
//
// Returns { rows, removed, skipped, overlapsWithoutRule }:
//   removed              { mesto: number of rows dropped }
//   skipped              named markets left alone for lack of preferred rows
//   overlapsWithoutRule  markets with both sources and no rule (worth a look)
export function applySourcePreference(rows, preferences = PREFERRED_SOURCE_BY_MARKET) {
  const kindsByMarket = new Map()
  for (const row of rows) {
    if (!kindsByMarket.has(row.Mesto)) kindsByMarket.set(row.Mesto, new Set())
    kindsByMarket.get(row.Mesto).add(sourceKindOf(row))
  }

  const active = new Map()
  const skipped = []
  for (const [mesto, preferred] of Object.entries(preferences)) {
    const kinds = kindsByMarket.get(mesto)
    if (!kinds) continue
    if (kinds.has(preferred)) active.set(mesto, preferred)
    else skipped.push(mesto)
  }

  const removed = {}
  const kept = rows.filter((row) => {
    const preferred = active.get(row.Mesto)
    if (!preferred || sourceKindOf(row) === preferred) return true
    removed[row.Mesto] = (removed[row.Mesto] ?? 0) + 1
    return false
  })

  const overlapsWithoutRule = Array.from(kindsByMarket)
    .filter(([mesto, kinds]) => kinds.size > 1 && !(mesto in preferences))
    .map(([mesto]) => mesto)

  return { rows: kept, removed, skipped, overlapsWithoutRule }
}

// One log line of what was done, for the generating scripts.
export function describeSourcePreference(result, label) {
  const parts = Object.entries(result.removed).map(([mesto, count]) => `${mesto}: ${count} rows of the other source dropped`)
  const lines = [`[${label}] source preference: ${parts.length > 0 ? parts.join('; ') : 'nothing to drop'}`]
  if (result.skipped.length > 0) lines.push(`[${label}] WARNING: rule left alone (no rows of the preferred source): ${result.skipped.join(', ')}`)
  if (result.overlapsWithoutRule.length > 0) {
    lines.push(`[${label}] WARNING: markets with two sources and no rule in src/data/sourcePreference.js: ${result.overlapsWithoutRule.join(', ')}`)
  }
  return lines
}
