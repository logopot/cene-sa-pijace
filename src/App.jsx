import { useLayoutEffect, useSyncExternalStore } from 'react'
import AppContent from './AppContent.jsx'
import { useMarketPrices } from './hooks/useMarketPrices.js'
import { hasSnapshot, removeSnapshot, subscribeToStyles, getStylesReady } from './utils/snapshot.js'
import { GlobalStyle } from './styles/globalStyle.js'

function App({ initialData }) {
  const { rows, loading, error, version } = useMarketPrices(initialData)
  const stylesReady = useSyncExternalStore(subscribeToStyles, getStylesReady, () => true)

  // Without hydration the leftover prerender helpers are removed here, once the
  // app can render the same content with data; with hydration, the homepage
  // removes them itself after it has hydrated (see useRemoveSnapshotWhenReady).
  // The prerendered HTML (see functions/_middleware.js and
  // scripts/prerender-home.mjs) keeps the real page on screen until the app can
  // render the same content with data AND its stylesheet (which loads without
  // blocking first paint, see vite.config.js). It's removed in a layout effect
  // - after React committed the real page but *before* the browser paints it -
  // so the swap happens within one frame.
  const ready = !loading && stylesReady
  useLayoutEffect(() => {
    if (ready && !initialData) removeSnapshot()
  }, [ready, initialData])

  // Hydration (initialData given): the first render must reproduce the
  // prerendered markup exactly, so there is nothing to hold back. Otherwise the
  // prerendered copy stays up and this render stays empty until ready.
  if (!initialData && !ready && hasSnapshot()) return <GlobalStyle />

  return <AppContent rows={rows} loading={loading} error={error} seed={version} />
}

export default App
