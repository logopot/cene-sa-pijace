import { useEffect, useState } from 'react'
import { fetchMarketPrices, fetchJkpPrices } from '../services/sheetsService.js'
import { hasAnyPrice } from '../utils/price.js'

export function useMarketPrices() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchMarketPrices(), fetchJkpPrices()])
      .then(([stipsRows, jkpRows]) => {
        if (cancelled) return
        // Some source records carry no usable price in any field (a fully
        // blank scrape row) - these render nothing useful anywhere in the UI,
        // so they're dropped here rather than reaching every downstream page
        // (grids, charts, weekly trends) individually.
        setRows([...stipsRows, ...jkpRows].filter(hasAnyPrice))
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
