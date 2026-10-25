import { useEffect, useState } from 'react'
import { fetchLatestPrices } from '../services/dataService.js'

// Rows arrive already filtered to ones with a usable price (see
// scripts/generate-data.mjs), so no client-side filtering is needed here.
// `initialData` is the result of fetchLatestPrices() when main.jsx already
// loaded it (to hydrate the prerendered page): the hook then starts out loaded
// and doesn't fetch again.
export function useMarketPrices(initialData) {
  const [rows, setRows] = useState(initialData?.rows ?? [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(initialData?.version ?? '')

  useEffect(() => {
    if (initialData) return undefined
    let cancelled = false

    fetchLatestPrices()
      .then(({ rows: latestRows, version: dataVersion }) => {
        if (cancelled) return
        setRows(latestRows)
        setVersion(dataVersion)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [initialData])

  return { rows, loading, error, version }
}
