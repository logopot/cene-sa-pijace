import { useMemo } from 'react'
import { parseMesto, isConsumerMarketType } from '../utils/market.js'
import { shuffleArray } from '../utils/shuffle.js'
import { pickWeeklyDrops } from '../utils/weeklyDrops.js'

// Owns the homepage's remaining rows-derived sections that don't depend on
// the global filter selection (see FilterContext.jsx, which now owns
// grad/category/pijaca and the FilterBar rendered globally in Header).
export function useMarketExplorer(rows) {
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
    return shuffleArray(unique).slice(0, 8)
  }, [rows])

  const weeklyDrops = useMemo(() => pickWeeklyDrops(rows), [rows])

  return { showcaseMarkets, weeklyDrops }
}
