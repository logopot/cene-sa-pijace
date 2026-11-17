// The lazily loaded page chunks, in one place: AppContent wraps them in React.lazy,
// main.jsx prefetches them when the browser is idle (see utils/prefetch.js). Both use
// the same import() so Vite keeps ONE chunk for each.
export const loadAnalytics = () => import('../pages/Analytics/Analytics.jsx')

// What to prefetch in the background: the product page first.
export const PREFETCH_LOADERS = [loadAnalytics]
