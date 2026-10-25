import { useMemo } from 'react'
import { parseMesto, isConsumerMarketType } from '../utils/market.js'
import { shuffleArray } from '../utils/shuffle.js'
import { pickWeeklyDrops } from '../utils/weeklyDrops.js'

// Owns the homepage's remaining rows-derived sections that don't depend on
// the global filter selection (see FilterContext.jsx, which now owns
// grad/category/pijaca and the FilterBar rendered globally in Header).
// `seed` makes both random picks reproducible (see utils/shuffle.js) - the app
// passes the data version, so the build-time prerender and the live page show
// the same cards, and they rotate whenever the data is refreshed.
export function useMarketExplorer(rows, seed) {
  const showcaseMarkets = useMemo(() => {
    const seen = new Set()
    const unique = []
    for (const row of rows) {
      if (seen.has(row.Mesto)) continue
      seen.add(row.Mesto)
      const parsed = parseMesto(row.Mesto)
      if (!isConsumerMarketType(parsed.type)) continue
      unique.push({ mesto: row.Mesto, ...parsed })
    }
    return shuffleArray(unique, seed === undefined ? undefined : `${seed}:markets`).slice(0, 8)
  }, [rows, seed])

  const weeklyDrops = useMemo(
    () => pickWeeklyDrops(rows, seed === undefined ? undefined : `${seed}:drops`),
    [rows, seed],
  )

  return { showcaseMarkets, weeklyDrops }
}
