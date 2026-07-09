import { useEffect, useState } from 'react'
import { fetchMarketPrices, fetchJkpPrices } from '../services/sheetsService.js'

export function useMarketPrices() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchMarketPrices(), fetchJkpPrices()])
      .then(([stipsRows, jkpRows]) => {
        if (cancelled) return
        setRows([...stipsRows, ...jkpRows])
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
