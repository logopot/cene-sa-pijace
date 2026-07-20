import { useCallback, useMemo, useState } from 'react'
import { CATEGORIES } from '../constants/categories.js'
import { ALL_MARKETS, ALL_CATEGORIES } from '../constants/filters.js'
import { parseMesto, isConsumerMarketType } from '../utils/market.js'
import { shuffleArray } from '../utils/shuffle.js'
import { pickWeeklyDrops } from '../utils/weeklyDrops.js'

function matchesSelection(row, { category, grad, pijaca }) {
  if (category && category !== ALL_CATEGORIES && row.Kategorija !== category) return false
  if (grad && parseMesto(row.Mesto).grad !== grad) return false
  if (pijaca && pijaca !== ALL_MARKETS && parseMesto(row.Mesto).pijaca !== pijaca) return false
  return true
}

// Owns only the homepage's chained Grad -> Category -> Market selection and
// its landing-page sections - submitting the filter bar navigates to the
// dedicated /grad/:citySlug/:marketSlug/:categorySlug results page (see
// FilterBar) instead of toggling in-place state.
//
// Grad is the top-level, unfiltered choice (also the target of the location-
// detect button - see LocationDetectButton.jsx), so it doesn't narrow by
// category the way it used to when category came first. Category now narrows
// by the chosen grad instead, mirroring the old direction one level down.
export function useMarketExplorer(rows) {
  const [category, setCategoryState] = useState('')
  const [grad, setGradState] = useState('')
  const [pijaca, setPijaca] = useState('')

  const cities = useMemo(() => {
    const unique = new Set(rows.map((row) => parseMesto(row.Mesto).grad))
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const categories = useMemo(() => {
    const present = new Set(
      rows.filter((row) => matchesSelection(row, { category: '', grad, pijaca: '' })).map((row) => row.Kategorija),
    )
    return CATEGORIES.filter((cat) => present.has(cat.name))
  }, [rows, grad])

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

  // Category is now the middle step (Grad -> Category -> Market), so
  // changing it only invalidates the market choice below it, not the grad
  // above it - defaults back to "every market in this city" rather than
  // clearing the field, same as a fresh grad selection does.
  const setCategory = useCallback(
    (value) => {
      setCategoryState(value)
      setPijaca(grad ? ALL_MARKETS : '')
    },
    [grad],
  )

  // Picking a city (manually or via geolocation - see LocationMenuItem.jsx)
  // now defaults category/pijaca to their "everything" sentinels instead of
  // leaving them empty, so the submit button is clickable the instant a city
  // is chosen (see FilterBar.jsx's handleSubmit) rather than requiring the
  // user to also pick a category/market first.
  const setGrad = useCallback((value) => {
    setGradState(value)
    setCategoryState(value ? ALL_CATEGORIES : '')
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
