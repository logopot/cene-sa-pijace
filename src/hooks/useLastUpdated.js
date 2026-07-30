import { useMemo } from 'react'
import { getRowTime, getRowRangeLabel } from '../utils/week.js'

// Same Source-presence convention useProductAnalytics.js uses to split
// STIPS vs JKP rows (row.Source is only ever populated on JKP archive rows).
function getLatestRow(rows) {
  let latest = null
  let latestTime = -Infinity

  for (const row of rows) {
    const time = getRowTime(row)
    if (time !== null && time > latestTime) {
      latestTime = time
      latest = row
    }
  }

  return latest
}

// Surfaces the most recent date per source out of the combined STIPS+JKP
// dataset (see useMarketPrices), formatted the same way as WeekStatus's
// badge, so the hero's "last updated" line always matches what the rest of
// the app calls "official data" for each source.
export function useLastUpdated(rows) {
  return useMemo(() => {
    const stipsRows = rows.filter((row) => !row.Source)
    const jkpRows = rows.filter((row) => row.Source)

    const latestStips = getLatestRow(stipsRows)
    const latestJkp = getLatestRow(jkpRows)

    return {
      stipsLabel: latestStips ? getRowRangeLabel(latestStips) : null,
      jkpLabel: latestJkp ? getRowRangeLabel(latestJkp) : null,
    }
  }, [rows])
}
