import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LANGUAGES = ['sr', 'en']

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
    fallbackLng: 'sr',
    supportedLngs: SUPPORTED_LANGUAGES,
    // Both bundles are always fetched up front (not just the active one) so
    // routing utilities (see productId.js's getProductUrlSlug) can resolve a
    // product-name URL slug in either language via i18n.getResource,
    // regardless of which language the UI is currently displaying.
    preload: SUPPORTED_LANGUAGES,
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    ...(prerender ? { resources: prerender.resources, lng: prerender.lng, initAsync: false, initImmediate: false } : {}),
    // Serbian is the site's primary language (promoted only in Serbia);
    // English exists for foreigners looking up Serbian market prices, so it
    // must be an explicit user choice (via LanguageSwitcher) rather than
    // something the browser's OS/navigator language picks automatically -
    // hence 'navigator' is intentionally excluded from the detection order.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
