import { Fragment, lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import MarketExplorer from './components/MarketExplorer/MarketExplorer.jsx'
import DisclaimerPage from './components/DisclaimerPage/DisclaimerPage.jsx'
import ScrollToTop from './components/ScrollToTop/ScrollToTop.jsx'
import ScrollToTopButton from './components/ScrollToTopButton/ScrollToTopButton.jsx'
import PageSkeleton from './components/PageSkeleton/PageSkeleton.jsx'
import CityDetails from './pages/CityDetails/CityDetails.jsx'
import MarketDetails from './pages/MarketDetails/MarketDetails.jsx'
import MarketCategoryDetails from './pages/MarketCategoryDetails/MarketCategoryDetails.jsx'
import NotFound from './pages/NotFound/NotFound.jsx'
import { useMarketPrices } from './hooks/useMarketPrices.js'
import { CITY_PATH_PREFIX, DISCLAIMER_PATH } from './constants/routeLocales.js'
import { FilterProvider } from './context/FilterContext.jsx'
import { hasSnapshot, removeSnapshot } from './utils/snapshot.js'
import { GlobalStyle } from './styles/globalStyle.js'
import { AppShell, Main } from './App.styled.js'

// The product page is the only one that pulls in the charting library, so
// it's split out of the entry bundle and fetched on demand.
const Analytics = lazy(() => import('./pages/Analytics/Analytics.jsx'))

function App() {
  const { rows, loading, error } = useMarketPrices()
  const location = useLocation()

  // The edge-injected HTML snapshot (see functions/_middleware.js) keeps the
  // real prices on screen until the app has its own data to render the same
  // content; removing it any earlier would leave a blank gap, any later a
  // duplicate page.
  useEffect(() => {
    if (!loading) removeSnapshot()
  }, [loading])

  if (loading && hasSnapshot()) return <GlobalStyle />

  return (
    <FilterProvider rows={rows}>
      <AppShell>
        <GlobalStyle />
        <ScrollToTop />
        <Header rows={rows} />
        <Main>
          <Suspense fallback={<PageSkeleton />}>
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
                  element={<Analytics key={location.key} rows={rows} loading={loading} error={error} />}
                />
              </Fragment>
            ))}

            {/* One route per language's disclaimer path (see routeLocales.js),
                all rendering the same DisclaimerPage component. */}
            {Object.values(DISCLAIMER_PATH).map((path) => (
              <Route key={path} path={path} element={<DisclaimerPage />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </Main>
        <Footer />
        <ScrollToTopButton />
      </AppShell>
    </FilterProvider>
  )
}

export default App
