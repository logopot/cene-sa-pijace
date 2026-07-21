import { useFilterState } from '../../hooks/useFilterState.js'
import { useFilterOptions } from '../../hooks/useFilterOptions.js'
import FilterBar from './FilterBar.jsx'

// Thin adapter over the shared FilterContext (see context/FilterContext.jsx)
// so each page can place the search bar wherever its own layout requires -
// MarketExplorer.jsx renders it below Hero, every detail page renders it at
// the very top of its own content - without repeating the context/derived-
// options wiring at every call site. Renders nothing while rows hasn't
// loaded yet (a still-loading or failed fetch), matching the previous
// behavior where the page's own loading/error branches never rendered the
// bar either.
function GlobalFilterBar() {
  const { grad, category, pijaca, setGrad, setCategory, setPijaca, rows } = useFilterState()
  const { cities, categories, markets } = useFilterOptions(rows, grad, category)

  if (rows.length === 0) return null

  return (
    <FilterBar
      category={category}
      grad={grad}
      pijaca={pijaca}
      categories={categories}
      cities={cities}
      markets={markets}
      onCategoryChange={setCategory}
      onGradChange={setGrad}
      onPijacaChange={setPijaca}
    />
  )
}

export default GlobalFilterBar
