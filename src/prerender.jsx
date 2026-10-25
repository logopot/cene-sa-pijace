// Build-time entry (bundled by scripts/prerender-home.mjs, never shipped to the
// browser): renders the real homepage - the same AppContent the live app
// renders - to an HTML string plus the styled-components CSS it needs, once per
// language, wrapped exactly like src/main.jsx wraps the app (same providers,
// same Suspense boundary) so React can hydrate it. The result is what the edge middleware injects into #snapshot, so
// first paint is the actual page, not an approximation of it.
import './prerenderGlobals.js'
import { Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { ThemeProvider, ServerStyleSheet } from 'styled-components'
import { HelmetProvider } from 'react-helmet-async'
import AppContent from './AppContent.jsx'
import PageSkeleton from './components/PageSkeleton/PageSkeleton.jsx'
import i18n from './i18n.js'
import { theme } from './styles/theme.js'
import { expandRows } from './services/dataService.js'

// One sheet across all languages, so the shared CSS is emitted once.
export function renderHomepages({ latest, languages }) {
  const rows = expandRows(latest)
  const sheet = new ServerStyleSheet()
  const pages = {}

  try {
    for (const lang of languages) {
      i18n.changeLanguage(lang)
      pages[lang] = renderToString(
        sheet.collectStyles(
          <HelmetProvider context={{}}>
            <ThemeProvider theme={theme}>
              <StaticRouter location="/">
                <Suspense fallback={<PageSkeleton />}>
                  <AppContent rows={rows} loading={false} error={null} seed={latest.version} />
                </Suspense>
              </StaticRouter>
            </ThemeProvider>
          </HelmetProvider>,
        ),
      )
    }
    return { pages, styleTags: sheet.getStyleTags() }
  } finally {
    sheet.seal()
  }
}
