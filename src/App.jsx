import { Fragment, useState, useSyncExternalStore } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import MarketExplorer from './components/MarketExplorer/MarketExplorer.jsx'
import DisclaimerPage from './components/DisclaimerPage/DisclaimerPage.jsx'
import ScrollToTop from './components/ScrollToTop/ScrollToTop.jsx'
import ScrollToTopButton from './components/ScrollToTopButton/ScrollToTopButton.jsx'
import FullScreenLoader from './components/FullScreenLoader/FullScreenLoader.jsx'
import CityDetails from './pages/CityDetails/CityDetails.jsx'
import MarketDetails from './pages/MarketDetails/MarketDetails.jsx'
import MarketCategoryDetails from './pages/MarketCategoryDetails/MarketCategoryDetails.jsx'
import Analytics from './pages/Analytics/Analytics.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import { useMarketPrices } from './hooks/useMarketPrices.js'
import { CITY_PATH_PREFIX } from './constants/routeLocales.js'
import i18n from './i18n.js'
import { GlobalStyle } from './styles/globalStyle.js'
import { AppShell, Main } from './App.styled.js'

// Reactively tracks i18n's own async init (resource preload, see i18n.js) -
// read directly off the singleton via useSyncExternalStore rather than
// useTranslation(), so this check itself never triggers react-i18next's
// Suspense integration (which would bypass this gate and fall through to
// main.jsx's Suspense fallback instead).
function subscribeToI18nInit(callback) {
  i18n.on('initialized', callback)
  return () => i18n.off('initialized', callback)
}

function getI18nReady() {
  return i18n.isInitialized
}

function useI18nReady() {
  return useSyncExternalStore(subscribeToI18nInit, getI18nReady)
}

// Real, step-based boot progress (no fake timer) - derived purely from the
// two actual async boot signals (i18n resource load, market data fetch) at
// render time, so the value can never stall or overflow past 100. This repo's
// lint config forbids calling setState from inside an effect (see the
// useSyncExternalStore gate above), so progress can't be sequenced via
// separate "did this just happen" effects; instead it's a pure function of
// which promises have resolved so far. i18n typically resolves first (small
// static JSON) while the Sheets fetch is still in flight, hence 40 before 65.
const PROGRESS_MOUNTED = 15
const PROGRESS_I18N_READY = 40
const PROGRESS_DATA_FETCHED = 65
const PROGRESS_ALL_READY = 100

function getInitializationProgress(i18nReady, dataLoaded) {
  if (i18nReady && dataLoaded) return PROGRESS_ALL_READY
  if (i18nReady) return PROGRESS_I18N_READY
  if (dataLoaded) return PROGRESS_DATA_FETCHED
  return PROGRESS_MOUNTED
}

function App() {
  const { rows, loading, error } = useMarketPrices()
  const location = useLocation()
  const i18nReady = useI18nReady()
  const initializationProgress = getInitializationProgress(i18nReady, !loading)
  // The loader's own visualProgress animation may still be catching up to
  // initializationProgress even after the real boot signals finish (see
  // FullScreenLoader.jsx) - onComplete fires once that visual chase reaches
  // 100, which is what actually gates unmounting, not the raw real value.
  const [loaderFinished, setLoaderFinished] = useState(false)

  // Keeps the full-screen loader mounted until both the price data and i18n
  // are ready AND its own perceptual animation has finished, so the header/
  // routes never render with untranslated keys, an empty product grid, or an
  // abrupt mid-animation cut (e.g. right after a language switch's hard
  // reload).
  if (!loaderFinished) {
    return (
      <>
        <GlobalStyle />
        <FullScreenLoader realProgress={initializationProgress} onComplete={() => setLoaderFinished(true)} />
      </>
    )
  }

  return (
    <AppShell>
      <GlobalStyle />
      <ScrollToTop />
      <Header rows={rows} />
      <Main>
        <Routes>
          <Route
            path="/"
            element={<MarketExplorer key={location.key} rows={rows} loading={loading} error={error} />}
          />

          {/* One route tree per language's city-path prefix (/grad/... for
              sr, /city/... for en, see routeLocales.js) - both shapes share
              the same param names and page components, so a URL built under
              either language always resolves. */}
          {Object.values(CITY_PATH_PREFIX).map((prefix) => (
            <Fragment key={prefix}>
              <Route
                path={`/${prefix}/:citySlug`}
                element={<CityDetails key={location.key} rows={rows} loading={loading} error={error} />}
              />
              <Route
                path={`/${prefix}/:citySlug/:marketSlug`}
                element={<MarketDetails key={location.key} rows={rows} loading={loading} error={error} />}
              />
              <Route
                path={`/${prefix}/:citySlug/:marketSlug/:categorySlug`}
                element={<MarketCategoryDetails key={location.key} rows={rows} loading={loading} error={error} />}
              />
              <Route
                path={`/${prefix}/:citySlug/:marketSlug/:categorySlug/:productSlug`}
                element={<Analytics key={location.key} rows={rows} />}
              />
            </Fragment>
          ))}

          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Main>
      <Footer />
      <ScrollToTopButton />
    </AppShell>
  )
}

export default App
