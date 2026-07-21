import { useContext } from 'react'
import { FilterContext } from '../context/filterContextInstance.js'

// Reads the global {grad, category, pijaca} selection + setters provided by
// FilterContext.jsx's FilterProvider (wrapped around the whole app in
// App.jsx) - used by Header.jsx to drive the search bar now rendered on
// every page.
export function useFilterState() {
  const context = useContext(FilterContext)
  if (!context) throw new Error('useFilterState must be used within a FilterProvider')
  return context
}
