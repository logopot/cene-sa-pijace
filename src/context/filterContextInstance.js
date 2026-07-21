import { createContext } from 'react'

// Split into its own file (no JSX/components here) so FilterContext.jsx can
// export only the FilterProvider component and useFilterState.js can export
// only the hook - eslint-plugin-react-refresh requires a file to export
// either all components or all non-components, never a mix.
export const FilterContext = createContext(null)
