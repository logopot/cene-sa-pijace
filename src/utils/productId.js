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
// parseMesto back would create a circular dependency.
// The rest of STIPS's row-identity fields (see stips-scraper's KEY_COLUMNS,
// minus Godina/Nedelja/Mesto) still travel as router state instead of query
// params - many product names collide across packaging/origin within the
// same category (e.g. "krastavac-salatar" spans Domaće/Uvoz(uvoz)/Uvoz(Grčka)
// and both standardno/posebno packaging), so the slug alone can't disambiguate them.
export function buildProductRoute(grad, pijaca, row, language) {
  const marketSlug = getMarketTypeUrlSlug(pijaca, language) ?? slugify(pijaca)
  return `/${getCityPathPrefix(language)}/${slugify(grad)}/${marketSlug}/${getCategoryUrlSlug(row.Kategorija, language)}/${getProductUrlSlug(row.Proizvod, language)}`
}

export function buildProductFilters(row) {
  return {
    kategorija: row.Kategorija,
    velicina: row.Velicina,
    pakovanje: row.Pakovanje,
    poreklo: row.Poreklo,
  }
}
