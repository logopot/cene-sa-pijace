import { useEffect, useState } from 'react'
import { fetchProductHistory } from '../services/dataService.js'

// Lazy full history for one product family. `result` remembers which slug it
// belongs to, so "loading" is simply "the stored result isn't for the
// current slug yet" - no state has to be reset synchronously inside the
// effect when the slug changes.
export function useProductHistory(familySlug) {
  const [result, setResult] = useState({ slug: null, rows: null, failed: false })

  useEffect(() => {
    if (!familySlug) return undefined
    let cancelled = false

    fetchProductHistory(familySlug)
      .then((rows) => {
        if (!cancelled) setResult({ slug: familySlug, rows, failed: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ slug: familySlug, rows: null, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [familySlug])

  const isCurrent = result.slug === familySlug
  return {
    rows: isCurrent ? result.rows : null,
    loading: Boolean(familySlug) && !isCurrent,
    failed: isCurrent && result.failed,
  }
}
