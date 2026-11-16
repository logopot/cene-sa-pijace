import { getRouteLanguage } from '../constants/routeLocales.js'

export const SUPPORTED_LANGUAGES = ['sr', 'en']

// The init options (everything except the prerender's inline resources). Kept as
// a function of the pathname so the language rules are testable:
//
// - An address written in a language (/city/..., /feedback, /grad/..., see
//   getRouteLanguage) is shown in THAT language from the first render: it is
//   passed as `lng`, so the detector - and with it any saved choice or the
//   one-time "forced sr" value in i18n.js - is never consulted for it. What the server
//   sent (title, H1, <html lang>) therefore stays what the client renders.
// - Only a path with no language (the homepage) falls back to the saved choice,
//   else Serbian.
// - The detector does not write anything: the route language must not become a
//   "saved choice". The choice is saved only by the language switch on a path
//   that has no language of its own (see LanguageSwitcher.jsx).
export function createI18nOptions(pathname, buildVersion = 'dev') {
  const routeLanguage = getRouteLanguage(pathname)
  return {
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
      // The version changes with every build, so a new deploy asks for a new URL
      // and never gets a translation file the browser cached before it (the
      // file itself is served with a long Cache-Control, see public/_headers).
      loadPath: `/locales/{{lng}}/{{ns}}.json?v=${buildVersion}`,
    },
    ...(routeLanguage ? { lng: routeLanguage } : {}),
    // Serbian is the site's primary language (promoted only in Serbia);
    // English exists for foreigners looking up Serbian market prices, so it
    // must be an explicit user choice (via LanguageSwitcher) rather than
    // something the browser's OS/navigator language picks automatically -
    // hence 'navigator' is intentionally excluded from the detection order.
    detection: {
      order: ['localStorage'],
      caches: [],
    },
    interpolation: {
      escapeValue: false,
    },
  }
}

