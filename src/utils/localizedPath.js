import {
  parseMesto,
  resolveGradBySlug,
  resolveMarketSlug,
  buildCityRoute,
  buildMarketRoute,
  buildMarketCategoryRoute,
} from './market.js'
import { getCategoryUrlSlug, resolveCategoryBySlug } from './categoryIcons.js'
import { buildProductRoute, productMatchesSlug } from './productId.js'
import { CITY_PATH_PREFIX, isDisclaimerPath, getDisclaimerPath } from '../constants/routeLocales.js'

// Re-localizes the current pathname for `targetLanguage` - swaps the
// /grad|city prefix and every dynamic segment's word, reusing the exact same
// resolver/builder pairs the rest of the app's routing already relies on
// (see market.js, categoryIcons.js, productId.js), so this stays correct by
// construction as new route shapes or slug tables are added there.
// Returns null for a static route with no per-language path (e.g. /) or an
// unresolvable/unknown segment, so the caller can fall back to a plain
// reload instead of redirecting to a broken URL.
export function translatePathForLanguage(pathname, rows, targetLanguage) {
  if (isDisclaimerPath(pathname)) return getDisclaimerPath(targetLanguage)

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const [prefix, citySlug, marketSlug, categorySlug, productSlug] = segments
  if (!Object.values(CITY_PATH_PREFIX).includes(prefix) || !citySlug) return null

  const grad = resolveGradBySlug(rows, citySlug)
  if (!grad) return null
  if (!marketSlug) return buildCityRoute(grad, targetLanguage)

  const pijaca = resolveMarketSlug(rows, grad, marketSlug)
  if (!pijaca) return null
  if (!categorySlug) return buildMarketRoute(grad, pijaca, targetLanguage)

  const categoryName = resolveCategoryBySlug(categorySlug)
  if (!categoryName) return null
  if (!productSlug) {
    return buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(categoryName, targetLanguage), targetLanguage)
  }

  const productRow = rows.find((row) => {
    const parsed = parseMesto(row.Mesto)
    return (
      parsed.grad === grad &&
      parsed.pijaca === pijaca &&
      row.Kategorija === categoryName &&
      productMatchesSlug(row.Proizvod, productSlug)
    )
  })
  if (!productRow) return null

  return buildProductRoute(grad, pijaca, productRow, targetLanguage)
}
