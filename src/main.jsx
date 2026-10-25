import { StrictMode, Suspense } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { HelmetProvider } from 'react-helmet-async'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import i18n from './i18n.js'
import App from './App.jsx'
import PageSkeleton from './components/PageSkeleton/PageSkeleton.jsx'
import { fetchLatestPrices } from './services/dataService.js'
import { hasStoredSelection } from './utils/storedSelection.js'
import { theme } from './styles/theme.js'

const container = document.getElementById('root')

function renderApp(initialData) {
  return (
    <StrictMode>
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Suspense fallback={<PageSkeleton />}>
              <App initialData={initialData} />
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </HelmetProvider>
    </StrictMode>
  )
}

function whenI18nReady() {
  return i18n.isInitialized ? Promise.resolve() : new Promise((resolve) => i18n.on('initialized', resolve))
}

// The edge serves the homepage with the real page already in #root
// (data-prerendered="sr", see functions/_middleware.js). When this visitor would
// get exactly that page - Serbian, no saved search selection - React takes over
// the existing nodes (hydration) instead of rebuilding them, so nothing
// repaints or moves. That needs the data and translations up front, because the
// first render has to match the markup. Anyone else (English, saved selection,
// every other route) gets a normal client render; the app swaps the prerendered
// copy out once it's ready (see App.jsx).
async function boot() {
  if (container.dataset.prerendered === 'sr' && !hasStoredSelection()) {
    try {
      const [initialData] = await Promise.all([fetchLatestPrices(), whenI18nReady()])
      if (i18n.resolvedLanguage === 'sr') {
        hydrateRoot(container, renderApp(initialData))
        return
      }
    } catch {
      // Fall through to the normal render, which reports the failure itself.
    }
  }
  createRoot(container).render(renderApp())
}

boot()
