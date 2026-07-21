import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ALL_MARKETS, ALL_CATEGORIES } from '../constants/filters.js'
import { resolveSelectionFromPath } from '../utils/urlFilterSync.js'
import { FilterContext } from './filterContextInstance.js'

const STORAGE_KEY = 'cene-sa-pijace:filters'
const EMPTY_SELECTION = { grad: '', category: '', pijaca: '' }

// Guarded exactly like i18n.js's own localStorage access (Safari private
// mode / disabled storage can throw on read/write) - this must never block
// rendering the search bar.
function readStoredSelection() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      grad: parsed.grad ?? '',
      category: parsed.category ?? '',
      pijaca: parsed.pijaca ?? '',
    }
  } catch {
    return null
  }
}

function writeStoredSelection(selection) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
  } catch {
    // Storage inaccessible - the selection still works for this session,
    // it just won't survive a refresh.
  }
}

// Global {grad, category, pijaca} selection behind the search bar now
// rendered in Header on every page (see Header.jsx) - previously local
// useState inside useMarketExplorer.js, owned only by the homepage.
// Persists to localStorage so it survives a hard refresh, and re-syncs from
// the URL on every navigation once `rows` has loaded: a direct visit or
// shared link to a specific city/market/category always wins over whatever
// was last saved (see resolveSelectionFromPath), while pages with no
// selection of their own (home, disclaimer, 404) leave it untouched.
export function FilterProvider({ rows, children }) {
  const location = useLocation()
  const [selection, setSelection] = useState(() => readStoredSelection() ?? EMPTY_SELECTION)
  // Tracks which pathname the URL->selection sync below has already run
  // for, so it fires (at most) once per navigation instead of looping -
  // this is a render-time state adjustment (see React's "Adjusting state
  // when a prop changes"), not a useEffect, since deriving state from a
  // prop/route change belongs in render, not an effect.
  const [syncedPathname, setSyncedPathname] = useState(null)

  if (rows.length > 0 && location.pathname !== syncedPathname) {
    setSyncedPathname(location.pathname)
    const resolved = resolveSelectionFromPath(location.pathname, rows)
    if (
      resolved &&
      (resolved.grad !== selection.grad || resolved.category !== selection.category || resolved.pijaca !== selection.pijaca)
    ) {
      setSelection(resolved)
    }
  }

  // This one *is* a real effect - it pushes React's state out to an
  // external system (localStorage), rather than deriving state from one.
  useEffect(() => {
    writeStoredSelection(selection)
  }, [selection])

  // Picking a city (manually or via geolocation - see LocationMenuItem.jsx)
  // defaults category/pijaca to their "everything" sentinels instead of
  // leaving them empty, so the submit button is clickable the instant a
  // city is chosen (see FilterBar.jsx's handleSubmit) rather than requiring
  // the user to also pick a category/market first. Same cascade
  // useMarketExplorer.js used before this state moved here.
  const setGrad = useCallback((value) => {
    setSelection({
      grad: value,
      category: value ? ALL_CATEGORIES : '',
      pijaca: value ? ALL_MARKETS : '',
    })
  }, [])

  // Changing category only invalidates the market choice below it, not the
  // grad above it - defaults back to "every market in this city" rather
  // than clearing the field, same as a fresh grad selection does.
  const setCategory = useCallback((value) => {
    setSelection((current) => ({
      ...current,
      category: value,
      pijaca: current.grad ? ALL_MARKETS : '',
    }))
  }, [])

  const setPijaca = useCallback((value) => {
    setSelection((current) => ({ ...current, pijaca: value }))
  }, [])

  const value = useMemo(
    () => ({ ...selection, setGrad, setCategory, setPijaca, rows }),
    [selection, setGrad, setCategory, setPijaca, rows],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}
