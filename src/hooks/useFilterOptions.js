import { useMemo } from 'react'
import { CATEGORIES } from '../constants/categories.js'
import { ALL_MARKETS, ALL_CATEGORIES } from '../constants/filters.js'
import { parseMesto } from '../utils/market.js'

function matchesSelection(row, { category, grad, pijaca }) {
  if (category && category !== ALL_CATEGORIES && row.Kategorija !== category) return false
  if (grad && parseMesto(row.Mesto).grad !== grad) return false
  if (pijaca && pijaca !== ALL_MARKETS && parseMesto(row.Mesto).pijaca !== pijaca) return false
  return true
}

// Dropdown option lists for the global FilterBar (see FilterContext.jsx and
// Header.jsx) - progressively narrowed by the current selection: cities are
// always every city in the dataset, categories narrow by the chosen grad,
// markets narrow by both grad and category. Extracted from the old
// useMarketExplorer.js (which owned this alongside the selection state
// itself before the FilterBar moved into the global Header) unchanged.
export function useFilterOptions(rows, grad, category) {
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

  return { cities, categories, markets }
}
