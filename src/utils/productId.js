import { getCategoryUrlSlug } from './categoryIcons.js'
import { getCityPathPrefix, getMarketTypeUrlSlug } from '../constants/routeLocales.js'
import i18n, { SUPPORTED_LANGUAGES } from '../i18n.js'

const SERBIAN_CHAR_MAP = {
  č: 'c', ć: 'c', ž: 'z', š: 's', đ: 'dj',
  Č: 'c', Ć: 'c', Ž: 'z', Š: 's', Đ: 'dj',
}

export function slugify(text) {
  return text
    .split('')
    .map((char) => SERBIAN_CHAR_MAP[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[()]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Localized URL word for a product name - looks up the translated name from
// i18n's dataValues.proizvod dictionary for `language` (via i18n.getResource,
// which reads any loaded language's resources directly, independent of the
// UI's currently active language) and slugifies that; falls back to
// slugifying the raw name when no translation exists (a product with no
// dedicated translation gracefully keeps its original text, same as the UI
// display fallback in translateValue.js).
function getProductUrlSlug(proizvod, language) {
  const dict = i18n.getResource(language, 'translation', 'dataValues.proizvod') ?? {}
  return slugify(dict[proizvod] ?? proizvod)
}

// Inverse of getProductUrlSlug - true when productSlug is proizvod's word in
// ANY supported language, so a link built under one language still resolves
// after a language switch or when bookmarked/shared across languages (see
// useProductAnalytics's matchesIdentity).
export function productMatchesSlug(proizvod, productSlug) {
  return SUPPORTED_LANGUAGES.some((language) => getProductUrlSlug(proizvod, language) === productSlug)
}

// Nested under the resolved market and category (see
// CityDetails/MarketDetails/MarketCategoryDetails) so a product's URL fully
// encodes its location: /grad|city/:citySlug/:marketSlug/:categorySlug/:productSlug,
// with the prefix, category, and product name all localized to `language`
// (see routeLocales.js and getProductUrlSlug above). grad/pijaca are passed
// in by the caller (already derived via parseMesto) rather than re-derived
// here, since market.js imports slugify from this file and importing
// parseMesto back would create a circular dependency. Several distinct rows
// can still share the exact same slug (e.g. "krastavac-salatar" spans both
// Domaće and Uvoz(Grčka) origins) - useProductAnalytics.js's exactRows just
// takes whichever one matches first, since the URL alone can't disambiguate
// further and every candidate belongs to the same product family anyway
// (see normalizeProductName).
export function buildProductRoute(grad, pijaca, row, language) {
  const marketSlug = getMarketTypeUrlSlug(pijaca, language) ?? slugify(pijaca)
  return `/${getCityPathPrefix(language)}/${slugify(grad)}/${marketSlug}/${getCategoryUrlSlug(row.Kategorija, language)}/${getProductUrlSlug(row.Proizvod, language)}`
}

// Strips a trailing parenthetical variety/size qualifier - "Krompir (beli)"
// and "Krompir (crveni)" both become "Krompir" - so STIPS's per-variety
// naming and JKP's single generic name for the same product (JKP never
// carries a variety suffix at all - see sheetsService.js's normalizeJkpRow)
// are recognized as one product family instead of silently missing each
// other (see useProductAnalytics.js's itemRows). Only ever strips a
// TRAILING parenthetical, never one mid-string - every STIPS name observed
// in the live sheet puts its qualifier at the end (e.g. "Paprika (šilja)"),
// so this can't accidentally eat a legitimate multi-word product name.
export function normalizeProductName(proizvod) {
  return proizvod.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

// The inverse of normalizeProductName above - extracts the trailing
// qualifier itself ("Krompir (beli)" -> { key: 'beli', label: 'Beli' })
// rather than stripping it, powering the variation filter tabs above the
// Price History Chart (see useProductAnalytics.js's availableVariations).
// Returns null for a name with no qualifier at all (e.g. JKP's plain
// "Krompir"), which only ever counts toward the unfiltered "all" aggregate,
// never getting its own tab.
export function extractVariation(proizvod) {
  const match = proizvod.match(/\(([^)]*)\)\s*$/)
  if (!match) return null
  const trimmed = match[1].trim()
  if (trimmed === '') return null
  return { key: trimmed.toLowerCase(), label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1) }
}
