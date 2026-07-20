// Internal sentinel for "all markets in this city" (the homepage's market
// dropdown default) - its localized URL representation lives in
// constants/routeLocales.js's ALL_MARKETS_URL_SLUGS.
export const ALL_MARKETS = '__ALL_MARKETS__'

// Internal sentinel for "every category" (the homepage's category dropdown
// default once a city is picked) - unlike ALL_MARKETS this has no URL
// representation of its own: submitting with it selected just navigates to
// the existing category-less MarketDetails/CityDetails route instead of a
// dedicated "all categories" page (see FilterBar.jsx's handleSubmit).
export const ALL_CATEGORIES = '__ALL_CATEGORIES__'
