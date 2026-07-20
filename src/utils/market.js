import { slugify } from './productId.js'
import { ALL_MARKETS } from '../constants/filters.js'
import {
  getCityPathPrefix,
  getAllMarketsUrlSlug,
  isAllMarketsUrlSlug,
  getMarketTypeUrlSlug,
  resolveMarketTypeBySlug,
} from '../constants/routeLocales.js'

// Known market-type spellings, keyed by lowercased raw text, in case the
// source ever emits an unaccented variant (e.g. "kvantaska pijaca").
const MARKET_TYPE_LABELS = {
  'zelena pijaca': 'Zelena pijaca',
  'kvantaška pijaca': 'Kvantaška pijaca',
  'kvantaska pijaca': 'Kvantaška pijaca',
  klanica: 'Otkupna mesta / Klanice',
  klanice: 'Otkupna mesta / Klanice',
  'stočna pijaca': 'Stočna pijaca',
  'stocna pijaca': 'Stočna pijaca',
  mlekara: 'Mlekara',
  maloprodaja: 'Maloprodaja',
  gazdinstvo: 'Gazdinstvo',
  silos: 'Silos',
  pijaca: 'Pijaca',
}

// Raw type suffixes that count as an actual consumer-facing market, as
// opposed to wholesale/trade classifications (klanica, mlekara, ...) - drives
// the landing-page showcase filter, independent of the display label (a
// named market's pijaca is its proper name, e.g. "Kalenić", but its type is
// still "zelena pijaca").
const CONSUMER_MARKET_TYPES = new Set([
  'zelena pijaca',
  'kvantaška pijaca',
  'kvantaska pijaca',
  'stočna pijaca',
  'stocna pijaca',
])

function normalizeType(type) {
  return type.trim().toLowerCase()
}

function formatMarketType(type) {
  const normalized = normalizeType(type)
  return MARKET_TYPE_LABELS[normalized] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

export function isConsumerMarketType(type) {
  return CONSUMER_MARKET_TYPES.has(type)
}

// Serbia's compound-name districts ("Južno-bački", "Severno-banatski", ...)
// are themselves hyphenated, so a naive split on every hyphen tears them in
// half. Recognized before the generic Grad-Type / Name-Grad-Type parsing
// below, and merged into the proper single-word "okrug" form.
const REGION_DISTRICTS = {
  'severno-bački': 'Severnobački okrug',
  'južno-bački': 'Južnobački okrug',
  'zapadno-bački': 'Zapadnobački okrug',
  'severno-banatski': 'Severnobanatski okrug',
  'srednje-banatski': 'Srednjebanatski okrug',
  'južno-banatski': 'Južnobanatski okrug',
}

function matchRegionDistrict(mesto) {
  const lower = mesto.toLowerCase()
  for (const [prefix, grad] of Object.entries(REGION_DISTRICTS)) {
    if (lower === prefix) return { grad, rest: '' }
    if (lower.startsWith(`${prefix}-`)) return { grad, rest: mesto.slice(prefix.length + 1) }
  }
  return null
}

// A Serbian district (okrug) name is a single adjective (e.g. "Braničevski",
// "Jablanički", "Raški") - unlike REGION_DISTRICTS's own compound districts
// above, the wholesale/regional sheet sometimes lists these bare, with no
// "okrug" suffix at all. Display-only normalization (see
// normalizeDistrictLabel below); city names in our data never happen to end
// this way, so the suffix check alone is enough to tell districts apart from
// cities without a hardcoded name list.
const DISTRICT_ADJECTIVE_SUFFIXES = ['ski', 'čki', 'ški']

// Mačvanski's two sub-regions (LO/Loznica, ŠA/Šabac) don't fit the plain
// "append okrug at the end" rule - "okrug" has to land between the adjective
// and the sub-region code (e.g. "Mačvanski LO" -> "Mačvanski okrug LO"), so
// they're handled as an explicit exception rather than the generic suffix
// rule.
const DISTRICT_SUBREGION_LABELS = {
  'Mačvanski LO': 'Mačvanski okrug LO',
  'Mačvanski ŠA': 'Mačvanski okrug ŠA',
}

// Normalizes a grad display label to always read "<district> okrug" for
// district-shaped names, without ever double-appending onto one that already
// has it (e.g. REGION_DISTRICTS's own "Severnobački okrug") - a no-op for
// anything that isn't a district at all (a normal city name). Display-only:
// callers apply this to the label they're about to render, never to the raw
// `grad` value itself, which stays exactly as parseMesto/REGION_DISTRICTS
// produced it for routing/filtering/matching (see translateDataValue in
// utils/translateValue.js and scripts/lib/productLabels.mjs, the two places
// this actually gets called from).
export function normalizeDistrictLabel(label) {
  if (!label) return label
  if (DISTRICT_SUBREGION_LABELS[label]) return DISTRICT_SUBREGION_LABELS[label]
  if (label.toLowerCase().includes('okrug')) return label

  const isDistrictAdjective = DISTRICT_ADJECTIVE_SUFFIXES.some((suffix) => label.endsWith(suffix))
  return isDistrictAdjective ? `${label} okrug` : label
}

// Mesto values from the sheet come in a few shapes:
// - "Grad-Type" for markets with no proper name, e.g. "Beograd-kvantaška pijaca"
// - "Name-Grad-Type" for named markets, e.g. "Kalenić-Beograd-zelena pijaca",
//   "Skadarlija-Beograd-zelena pijaca" - these must group under Grad "Beograd"
//   with the proper name ("Kalenić"/"Skadarlija") as the market, not the
//   other way around.
// - "District-Type" for regional/wholesale entries, e.g.
//   "Južno-bački-klanica", where the district name itself is hyphenated.
export function parseMesto(mesto) {
  const region = matchRegionDistrict(mesto)
  if (region) {
    const type = region.rest ? normalizeType(region.rest) : null
    return {
      grad: region.grad,
      pijaca: region.rest ? formatMarketType(region.rest) : region.grad,
      type,
    }
  }

  const parts = mesto.split('-')
  if (parts.length >= 3) {
    const [marketName, grad, ...typeParts] = parts
    return { grad, pijaca: marketName, type: normalizeType(typeParts.join('-')) }
  }
  if (parts.length === 2) {
    const [grad, type] = parts
    return { grad, pijaca: formatMarketType(type), type: normalizeType(type) }
  }
  return { grad: mesto, pijaca: mesto, type: null }
}

// Localized URL word for a market - a generic (unnamed) market type (e.g.
// "Zelena pijaca") gets a per-language word from routeLocales.js; a named
// market (e.g. "Kalenić") is a proper noun, so it's never translated and
// keeps the same slugify(pijaca) in every language.
function getMarketUrlSlug(pijaca, language) {
  return getMarketTypeUrlSlug(pijaca, language) ?? slugify(pijaca)
}

// City-level URL for the /grad|city/:citySlug route (see CityDetails) - keyed
// on grad alone, listing every named market within that city as its own
// card. language picks the /grad vs /city prefix (see routeLocales.js).
export function buildCityRoute(grad, language) {
  return `/${getCityPathPrefix(language)}/${slugify(grad)}`
}

// Market-level URL for the nested /grad|city/:citySlug/:marketSlug route
// (see MarketDetails) - identifies one specific named market within a city.
export function buildMarketRoute(grad, pijaca, language) {
  return `/${getCityPathPrefix(language)}/${slugify(grad)}/${getMarketUrlSlug(pijaca, language)}`
}

// Inverse of buildCityRoute - scans rows for the first Mesto whose grad
// slugifies to a match, since grad itself isn't stored pre-slugified anywhere.
export function resolveGradBySlug(rows, citySlug) {
  for (const row of rows) {
    const { grad } = parseMesto(row.Mesto)
    if (slugify(grad) === citySlug) return grad
  }
  return null
}

// Inverse of buildMarketRoute's second segment - scans rows already narrowed
// to the resolved grad for the first pijaca whose slug matches.
export function resolvePijacaBySlug(rows, grad, marketSlug) {
  if (!grad) return null
  // A generic market type's slug is localized (see getMarketUrlSlug), so
  // match it against the raw type label directly rather than re-slugifying;
  // anything else falls back to matching a named market's plain slug.
  const typeLabel = resolveMarketTypeBySlug(marketSlug)
  for (const row of rows) {
    const parsed = parseMesto(row.Mesto)
    if (parsed.grad !== grad) continue
    if (typeLabel ? parsed.pijaca === typeLabel : slugify(parsed.pijaca) === marketSlug) return parsed.pijaca
  }
  return null
}

// Category-results URL for the /grad|city/:citySlug/:marketSlug/:categorySlug
// route (see MarketCategoryDetails) - pijaca may be the ALL_MARKETS sentinel
// (from the homepage's "Sve pijace u tom gradu" option), which maps to the
// language's reserved "all markets" segment instead of slugifying a real
// market name. categoryUrlSlug is expected to already be localized (see
// categoryIcons.js's getCategoryUrlSlug).
export function buildMarketCategoryRoute(grad, pijaca, categoryUrlSlug, language) {
  const marketSlug = pijaca === ALL_MARKETS ? getAllMarketsUrlSlug(language) : getMarketUrlSlug(pijaca, language)
  return `/${getCityPathPrefix(language)}/${slugify(grad)}/${marketSlug}/${categoryUrlSlug}`
}

// Inverse of buildMarketCategoryRoute's market segment - resolves any
// language's reserved "all markets" segment back to the sentinel, otherwise
// defers to the normal per-row pijaca slug match.
export function resolveMarketSlug(rows, grad, marketSlug) {
  if (isAllMarketsUrlSlug(marketSlug)) return ALL_MARKETS
  return resolvePijacaBySlug(rows, grad, marketSlug)
}
