import { useCallback, useMemo, useState } from 'react'
import { CATEGORIES } from '../constants/categories.js'
import { ALL_MARKETS } from '../constants/filters.js'
import { parseMesto, isConsumerMarketType } from '../utils/market.js'
import { shuffleArray } from '../utils/shuffle.js'
import { pickWeeklyDrops } from '../utils/weeklyDrops.js'

function matchesSelection(row, { category, grad, pijaca }) {
  if (category && row.Kategorija !== category) return false
  if (grad && parseMesto(row.Mesto).grad !== grad) return false
  if (pijaca && pijaca !== ALL_MARKETS && parseMesto(row.Mesto).pijaca !== pijaca) return false
  return true
}

// Owns only the homepage's chained Category -> City -> Market selection and
// its landing-page sections - submitting the filter bar navigates to the
// dedicated /grad/:citySlug/:marketSlug/:categorySlug results page (see
// FilterBar) instead of toggling in-place state.
export function useMarketExplorer(rows) {
  const [category, setCategoryState] = useState('')
  const [grad, setGradState] = useState('')
  const [pijaca, setPijaca] = useState('')

  const categories = useMemo(() => {
    const present = new Set(rows.map((row) => row.Kategorija))
    return CATEGORIES.filter((cat) => present.has(cat.name))
  }, [rows])

  const cities = useMemo(() => {
    const unique = new Set(
      rows.filter((row) => matchesSelection(row, { category, grad: '', pijaca: '' })).map((row) => parseMesto(row.Mesto).grad),
    )
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [rows, category])

  const markets = useMemo(() => {
    if (!grad) return []
    const unique = new Set(
      rows.filter((row) => matchesSelection(row, { category, grad, pijaca: '' })).map((row) => parseMesto(row.Mesto).pijaca),
    )
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [rows, category, grad])

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

  const setCategory = useCallback((value) => {
    setCategoryState(value)
    setGradState('')
    setPijaca('')
  }, [])

  const setGrad = useCallback((value) => {
    setGradState(value)
    setPijaca(value ? ALL_MARKETS : '')
  }, [])

  return {
    category,
    grad,
    pijaca,
    categories,
    cities,
    markets,
    showcaseMarkets,
    weeklyDrops,
    setCategory,
    setGrad,
    setPijaca,
  }
}
