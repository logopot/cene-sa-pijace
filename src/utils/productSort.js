const COLLATOR_LOCALE = 'sr-Latn'

// CenaDom is already a real number or null by the time it reaches a page
// component (see sheetsService.js's parseNumeric) - Infinity as the
// not-a-number fallback is a defensive guardrail, not a real-world case,
// but guarantees a missing price sorts after every priced entry within its
// own product-name group rather than throwing off the comparison.
function normalizedPrice(value) {
  // Number(null) is 0, not NaN - null/undefined must be checked explicitly
  // first or a missing price would sort as free instead of last.
  if (value === null || value === undefined) return Infinity
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : Infinity
}

// Multi-level sort for the "Sve pijace u tom gradu" (all-markets) category
// view (see MarketCategoryDetails.jsx's useCategoryMarketData): groups every
// market's cards by product name first, with proper Serbian collation so
// č/ć/š/ž/đ order correctly, then within an identical product name orders by
// dominant price ascending (e.g. Ananas at Kalenić before the pricier
// Kvantaš one) - a missing price sorts after every priced entry within that
// same product's group, never globally last.
export function compareForAllMarketsView(a, b) {
  const nameCompare = a.Proizvod.localeCompare(b.Proizvod, COLLATOR_LOCALE)
  if (nameCompare !== 0) return nameCompare
  return normalizedPrice(a.CenaDom) - normalizedPrice(b.CenaDom)
}
