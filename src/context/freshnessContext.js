import { createContext } from 'react'

// The freshness reference (newest JKP date, newest STIPS week - see
// data/freshness.js) of the data the app shows. Own file for the same reason as
// filterContextInstance.js: a file may export components or non-components, not both.
export const FreshnessContext = createContext(null)
