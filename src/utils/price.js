// True for any real numeric price, including 0 - only null/undefined (the
// sheet parser's placeholder for a blank cell, see sheetsService.js) or NaN
// count as "missing".
export function hasPrice(value) {
  return value !== null && value !== undefined && !Number.isNaN(value)
}

// A row's primary price is normally the CenaMin-CenaMax range, but some
// source records (e.g. STIPS categories that only report one figure, like
// livestock sold per head) omit that range while still carrying CenaDom -
// falling back to it as a single value keeps those rows showing a real price
// instead of the broken "- - -" placeholder.
export function getDisplayPrice(row) {
  if (hasPrice(row.CenaMin) && hasPrice(row.CenaMax)) {
    return { type: 'range', min: row.CenaMin, max: row.CenaMax }
  }
  if (hasPrice(row.CenaDom)) {
    return { type: 'single', value: row.CenaDom }
  }
  return null
}

// True when a row has no usable price in any field - these carry nothing
// worth showing and should be filtered out before reaching the UI (see
// useMarketPrices.js).
export function hasAnyPrice(row) {
  return getDisplayPrice(row) !== null
}

// CenaDom is normally a precomputed single average, but falls back to the
// mathematical midpoint of CenaMin/CenaMax so a row that only carries a
// price *range* still yields one comparable number (used by the "average
// price" badge and by useProductAnalytics's city/history comparisons)
// instead of showing as missing.
export function getAveragePrice(row) {
  if (hasPrice(row.CenaDom)) return row.CenaDom
  if (hasPrice(row.CenaMin) && hasPrice(row.CenaMax)) return (row.CenaMin + row.CenaMax) / 2
  if (hasPrice(row.CenaMin)) return row.CenaMin
  if (hasPrice(row.CenaMax)) return row.CenaMax
  return null
}
