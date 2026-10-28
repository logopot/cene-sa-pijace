import { parseMesto } from './market.js'
import { getRowTime } from './week.js'
import { getAveragePrice as getComparablePrice } from './price.js'

// Picks a single representative price for a city out of its markets' own
// CenaDom-preferring prices (see getComparablePrice) - the highest price any
// market in that city actually charges. Averaging (625 for Kvantaš at 500 +
// Skadarlija at 750) invented a figure no market ever charged; picking the
// mode broke just as badly the moment a city's markets didn't repeat a price
// (Kvantaš 500 / Kalenić 700 / Skadarlija 750, no two alike, tie-broke down
// to the lowest at 500) - it let Belgrade's true 750 RSD market get
// undercounted below cheaper cities like Leskovac at 600, which is never
// correct: a city's aggregate can't be lower than one of its own markets. A
// single-market city trivially returns that market's own price.
function highestMarketPrice(prices) {
  if (prices.length === 0) return null
  return Math.max(...prices)
}

// Each city's own latest record for a product family, not a single global
// latest timestamp - a city whose scraper ran even a day/week earlier than
// the overall max would otherwise be silently dropped from the comparison
// (see the STIPS/JKP note on useMarketExplorer.js for the same class of bug).
// Cheapest city first. Shared by the product page (useProductAnalytics) and
// the build-time JSON-LD (scripts/generate-data.mjs), so both always agree.
export function computeCityComparison(itemRows) {
  const byCity = new Map()
  itemRows.forEach((row) => {
    const time = getRowTime(row)
    if (time === null) return
    const { grad } = parseMesto(row.Mesto)
    const existing = byCity.get(grad)
    if (!existing || time > existing.time) {
      byCity.set(grad, { time, rows: [row] })
    } else if (time === existing.time) {
      existing.rows.push(row)
    }
  })
  return Array.from(byCity.entries())
    .map(([grad, { rows: cityRows }]) => ({
      grad,
      price: highestMarketPrice(cityRows.map(getComparablePrice).filter((price) => price !== null)),
    }))
    .filter((entry) => entry.price !== null)
    .sort((a, b) => a.price - b.price)
}

// Google's Product rich-result schema wants a single offers block, not a
// per-city breakdown - cheapest/priciest city (see computeCityComparison)
// already give the low/high bound across cities for the product's latest
// week, so they map directly to AggregateOffer without recomputing anything.
export function buildProductJsonLd({ name, category, cityComparison }) {
  const cheapest = cityComparison[0]
  const priciest = cityComparison[cityComparison.length - 1]
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    category,
    ...(cheapest &&
      priciest && {
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'RSD',
          lowPrice: cheapest.price,
          highPrice: priciest.price,
          offerCount: cityComparison.length,
        },
      }),
  }
}
