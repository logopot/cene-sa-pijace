import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './i18n.js'
import App from './App.jsx'
import FullScreenLoader from './components/FullScreenLoader/FullScreenLoader.jsx'
import { theme } from './styles/theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Suspense fallback={<FullScreenLoader />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
