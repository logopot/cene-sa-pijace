import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { createI18nOptions, SUPPORTED_LANGUAGES } from './utils/i18nOptions.js'

// Set by vite.config.js (define); absent where this file is bundled without it
// (the homepage prerender, which gets its translations inline and never fetches).
// eslint-disable-next-line no-undef
const BUILD_VERSION = typeof __BUILD_VERSION__ === 'undefined' ? 'dev' : __BUILD_VERSION__

export { SUPPORTED_LANGUAGES }

// One-time migration for visitors who were auto-detected into English before
// 'navigator' was removed from the detector's order (see below) - without
// this, their old cached i18nextLng='en' would look identical to a
// deliberate post-fix choice and be honored forever. Runs once per browser;
// wrapped in try/catch since localStorage can throw (e.g. Safari private
// mode, disabled storage) and this must never block i18n init.
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const MIGRATION_KEY = 'i18n_forced_sr_v1'
    if (!window.localStorage.getItem(MIGRATION_KEY)) {
      window.localStorage.setItem('i18nextLng', 'sr')
      window.localStorage.setItem(MIGRATION_KEY, 'true')
    }
  }
} catch {
  // Storage inaccessible - fall through to normal detection/fallbackLng.
}

// The build-time homepage prerender (src/prerender.jsx) runs in Node: there is
// no fetch origin for the http backend and no browser to detect a language
// from, so it hands over both translation bundles up front and picks the
// language itself. In the browser this is undefined and nothing changes.
const prerender = globalThis.__PRERENDER_I18N__

if (!prerender) i18n.use(Backend).use(LanguageDetector)

i18n
  .use(initReactI18next)
  .init({
    ...createI18nOptions(typeof window === 'undefined' ? '' : window.location.pathname, BUILD_VERSION),
    ...(prerender ? { resources: prerender.resources, lng: prerender.lng, initAsync: false, initImmediate: false } : {}),
  })

export default i18n
