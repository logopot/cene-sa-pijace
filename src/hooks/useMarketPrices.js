import { useEffect, useState } from 'react'
import { fetchLatestPrices } from '../services/dataService.js'

// Rows arrive already filtered to ones with a usable price (see
// scripts/generate-data.mjs), so no client-side filtering is needed here.
export function useMarketPrices() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchLatestPrices()
      .then(({ rows: latestRows }) => {
        if (cancelled) return
        setRows(latestRows)
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
  }, [])

  return { rows, loading, error }
}
