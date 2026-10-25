// Must be imported before anything that imports src/i18n.js (see
// src/prerender.jsx): hands i18n both translation bundles so it initialises
// synchronously in Node. Build-time only - never part of the browser bundle.
import sr from '../public/locales/sr/translation.json'
import en from '../public/locales/en/translation.json'

globalThis.__PRERENDER_I18N__ = {
  resources: { sr: { translation: sr }, en: { translation: en } },
  lng: 'sr',
}
