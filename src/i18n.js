import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LANGUAGES = ['sr', 'en']

i18n
  .use(Backend)
  .use(LanguageDetector)
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
