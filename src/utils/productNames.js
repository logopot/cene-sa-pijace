import { PRODUCT_NAMES_EN } from '../data/productNamesEn.js'

// The name a product is SHOWN under in `language`. English comes from the
// complete display dictionary (src/data/productNamesEn.js); a name it lacks falls
// back to the locale file's dictionary, then to the Serbian text. Serbian is
// always the raw name. Only for display: URL slugs are not derived from this.
export function displayProductName(language, raw, localeDict = {}) {
  if (language === 'en') return PRODUCT_NAMES_EN[raw] ?? localeDict[raw] ?? raw
  return raw
}

// Product names of the data that the English dictionary does not cover.
export function untranslatedProductNames(names) {
  return Array.from(new Set(names.map((name) => String(name).trim())))
    .filter((name) => name && !(name in PRODUCT_NAMES_EN))
    .sort((a, b) => a.localeCompare(b, 'sr'))
}
