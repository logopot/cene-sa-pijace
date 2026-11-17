import { useContext } from 'react'
import { FreshnessContext } from '../context/freshnessContext.js'
import { isFreshRow } from '../data/freshness.js'

// { reference, isFresh(row) } for whatever sits under AppContent. Without a provider
// (a test, a standalone render) nothing is stale.
export function useFreshness() {
  const reference = useContext(FreshnessContext)
  return {
    reference,
    isFresh: (row) => (reference ? isFreshRow(row, reference) : true),
  }
}
