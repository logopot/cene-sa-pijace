import { LuShoppingBasket } from 'react-icons/lu'
import { CATEGORIES } from '../constants/categories.js'
import { CATEGORY_URL_SLUGS } from '../constants/routeLocales.js'

export function getCategoryIcon(kategorijaName) {
  return CATEGORIES.find((category) => category.name === kategorijaName)?.icon ?? LuShoppingBasket
}

// Keys theme.gradients (see src/styles/theme.js) for the ProductCard image
// header - falls back to 'default' for any category without a dedicated tone.
// This is the stable, language-independent identifier (also the i18n
// `categories.*` key) - NOT the URL word, see getCategoryUrlSlug for that.
export function getCategorySlug(kategorijaName) {
  return CATEGORIES.find((category) => category.name === kategorijaName)?.slug ?? 'default'
}

// The localized URL word for a category (see routeLocales's
// CATEGORY_URL_SLUGS) - e.g. the canonical "fruit" slug reads "voce" in a
// Serbian URL and "fruits" in an English one.
export function getCategoryUrlSlug(kategorijaName, language) {
  const canonicalSlug = getCategorySlug(kategorijaName)
  const table = CATEGORY_URL_SLUGS[language] ?? CATEGORY_URL_SLUGS.sr
  return table[canonicalSlug] ?? canonicalSlug
}

// Inverse of getCategoryUrlSlug - resolves a URL categorySlug segment (see
// MarketCategoryDetails) back to the raw Kategorija name stored in the sheet.
// Scans every language's URL vocabulary (not just the active one) so a link
// built under one language still resolves correctly if the URL is visited
// after switching languages, or bookmarked/shared across languages.
export function resolveCategoryBySlug(categorySlug) {
  for (const table of Object.values(CATEGORY_URL_SLUGS)) {
    const canonicalSlug = Object.keys(table).find((slug) => table[slug] === categorySlug)
    if (canonicalSlug) {
      const match = CATEGORIES.find((category) => category.slug === canonicalSlug)
      if (match) return match.name
    }
  }
  return null
}
