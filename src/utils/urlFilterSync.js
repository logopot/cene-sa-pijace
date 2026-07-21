import { matchPath } from 'react-router-dom'
import { ALL_MARKETS, ALL_CATEGORIES } from '../constants/filters.js'
import { CITY_PATH_PREFIX } from '../constants/routeLocales.js'
import { resolveGradBySlug, resolvePijacaBySlug, resolveMarketSlug } from './market.js'
import { resolveCategoryBySlug } from './categoryIcons.js'

// Mirrors App.jsx's own route registration (one tree per language's city
// path prefix) - most-specific pattern first so a longer URL doesn't get
// mistaken for a shorter one it also happens to start with.
function buildPatterns() {
  const patterns = []
  for (const prefix of Object.values(CITY_PATH_PREFIX)) {
    patterns.push(`/${prefix}/:citySlug/:marketSlug/:categorySlug/:productSlug`)
    patterns.push(`/${prefix}/:citySlug/:marketSlug/:categorySlug`)
    patterns.push(`/${prefix}/:citySlug/:marketSlug`)
    patterns.push(`/${prefix}/:citySlug`)
  }
  return patterns
}
const ROUTE_PATTERNS = buildPatterns()

// Reads whatever {grad, category, pijaca} the current URL encodes, for the
// global FilterBar (see FilterContext.jsx) to hydrate from on a direct visit
// or hard refresh - reuses each page's own exact resolver (CityDetails uses
// resolveGradBySlug alone, MarketDetails adds resolvePijacaBySlug,
// MarketCategoryDetails/Analytics add resolveMarketSlug + resolveCategoryBySlug)
// rather than inventing new resolution logic, so this always agrees with
// whatever the page itself just rendered. Segments the matched route doesn't
// carry default to the same ALL_CATEGORIES/ALL_MARKETS sentinels FilterBar's
// own cascade already uses, so the round trip (visit page -> read state ->
// resubmit) reproduces the same URL. Returns null for any pathname that
// isn't a city-prefixed route (home, disclaimer, 404) - callers should leave
// existing state untouched in that case.
export function resolveSelectionFromPath(pathname, rows) {
  for (const pattern of ROUTE_PATTERNS) {
    const match = matchPath(pattern, pathname)
    if (!match) continue

    const { citySlug, marketSlug, categorySlug } = match.params
    const grad = resolveGradBySlug(rows, citySlug)
    if (!grad) return null

    const pijaca =
      marketSlug === undefined ? ALL_MARKETS
      : categorySlug === undefined ? resolvePijacaBySlug(rows, grad, marketSlug)
      : resolveMarketSlug(rows, grad, marketSlug)
    if (!pijaca) return null

    const category = categorySlug === undefined ? ALL_CATEGORIES : resolveCategoryBySlug(categorySlug)
    if (!category) return null

    return { grad, category, pijaca }
  }
  return null
}
