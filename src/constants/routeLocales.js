// Localized URL vocabulary - keeps the path itself synchronized with
// i18n.language, independent of the internal canonical identifiers used
// elsewhere (CATEGORIES[].slug / the i18n `categories.*` keys, see
// constants/categories.js) which stay stable across languages.
export const DEFAULT_LANGUAGE = 'sr'

// The leading path segment: /grad/... (sr) vs /city/... (en). App.jsx
// registers one route tree per prefix here, so adding a language only
// requires an entry in this object.
export const CITY_PATH_PREFIX = {
  sr: 'grad',
  en: 'city',
}

export function getCityPathPrefix(language) {
  return CITY_PATH_PREFIX[language] ?? CITY_PATH_PREFIX[DEFAULT_LANGUAGE]
}

// Per-language URL word for each category, keyed by the canonical
// CATEGORIES[].slug (NOT the URL word itself) - e.g. the canonical "fruit"
// reads "voce" in a Serbian URL and "fruits" in an English one.
export const CATEGORY_URL_SLUGS = {
  sr: {
    eggsPoultry: 'jaja-zivinsko-meso',
    meat: 'meso',
    dairy: 'mlecni-proizvodi',
    milk: 'mleko',
    vegetables: 'povrce',
    fruit: 'voce',
    grains: 'zitarice',
  },
  en: {
    eggsPoultry: 'eggs-poultry',
    meat: 'meat',
    dairy: 'dairy',
    milk: 'milk',
    vegetables: 'vegetables',
    fruit: 'fruits',
    grains: 'grains',
  },
}

// Per-language URL word for a generic (unnamed) market type, keyed by the
// raw display label market.js's formatMarketType produces - e.g. "Zelena
// pijaca" reads "zelena-pijaca" in a Serbian URL and "green-market" in an
// English one. Named markets (Kalenić, Skadarlija, ...) are proper nouns and
// are never in this table - they stay as slugify(pijaca) in every language.
export const MARKET_TYPE_URL_SLUGS = {
  sr: {
    'Zelena pijaca': 'zelena-pijaca',
    'Kvantaška pijaca': 'kvantaska-pijaca',
    'Otkupna mesta / Klanice': 'otkupna-mesta-klanice',
    'Stočna pijaca': 'stocna-pijaca',
    Mlekara: 'mlekara',
    Maloprodaja: 'maloprodaja',
    Gazdinstvo: 'gazdinstvo',
    Silos: 'silos',
    Pijaca: 'pijaca',
  },
  en: {
    'Zelena pijaca': 'green-market',
    'Kvantaška pijaca': 'wholesale-market',
    'Otkupna mesta / Klanice': 'procurement-slaughterhouses',
    'Stočna pijaca': 'livestock-market',
    Mlekara: 'dairy-plant',
    Maloprodaja: 'retail',
    Gazdinstvo: 'farm',
    Silos: 'silo',
    Pijaca: 'market',
  },
}

// Returns the localized word for a generic market type, or null when pijaca
// isn't one (a named/proper market) - callers fall back to slugify(pijaca)
// for that case (kept out of this file to avoid a circular import with
// utils/productId.js, which this file is itself imported by).
export function getMarketTypeUrlSlug(pijaca, language) {
  const table = MARKET_TYPE_URL_SLUGS[language] ?? MARKET_TYPE_URL_SLUGS[DEFAULT_LANGUAGE]
  return table[pijaca] ?? null
}

// Inverse of getMarketTypeUrlSlug - scans every language's table (not just
// the active one) so a link built in one language still resolves after a
// language switch. Returns null when marketSlug doesn't match any generic
// type word (a named market's plain slug, or an unresolvable one).
export function resolveMarketTypeBySlug(marketSlug) {
  for (const table of Object.values(MARKET_TYPE_URL_SLUGS)) {
    const rawType = Object.keys(table).find((pijaca) => table[pijaca] === marketSlug)
    if (rawType) return rawType
  }
  return null
}

// URL word for the homepage's "Sve pijace u tom gradu" / "all markets" market
// selection (see constants/filters.js's ALL_MARKETS sentinel).
export const ALL_MARKETS_URL_SLUGS = {
  sr: 'sve-pijace',
  en: 'all-markets',
}

export function getAllMarketsUrlSlug(language) {
  return ALL_MARKETS_URL_SLUGS[language] ?? ALL_MARKETS_URL_SLUGS[DEFAULT_LANGUAGE]
}

export function isAllMarketsUrlSlug(marketSlug) {
  return Object.values(ALL_MARKETS_URL_SLUGS).includes(marketSlug)
}
