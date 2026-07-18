import { slugify } from '../../src/utils/productId.js'
import { readJsonFile } from './googleSheets.mjs'

// Node-safe stand-in for src/utils/translateValue.js + the private
// getProductUrlSlug in src/utils/productId.js. Both of those go through the
// live i18next singleton (src/i18n.js), which loads its JSON resources via a
// relative-path fetch ('/locales/{{lng}}/translation.json') - that only
// resolves inside a browser with an origin, so it silently never finishes
// loading when imported into a plain Node script. Reading the two locale
// files straight off disk sidesteps i18next entirely and gives the exact
// same dataValues.* dictionaries the app itself uses.
const LOCALES = {
  sr: readJsonFile('public/locales/sr/translation.json'),
  en: readJsonFile('public/locales/en/translation.json'),
}

export const SUPPORTED_LANGUAGES = ['sr', 'en']

// Mirrors translateDataValue(t, field, raw) - dictionary miss falls back to
// the raw Serbian value (e.g. a product with no translation yet), same
// graceful-fallback rule as the live UI.
export function translateDataValue(language, field, raw) {
  if (raw === undefined || raw === null || raw === '') return raw
  const dict = LOCALES[language]?.dataValues?.[field] ?? {}
  return dict[raw] ?? raw
}

// The URL word for a product name in `language` - mirrors productId.js's
// private getProductUrlSlug (translated name, slugified; untranslated
// products fall back to slugifying the raw Serbian name).
export function getProductUrlSlug(proizvod, language) {
  return slugify(translateDataValue(language, 'proizvod', proizvod))
}

// Canonical, language-independent identity for a product - used to key its
// one shared OG image (see scripts/generate-og-images.mjs) so the sr and en
// routes for the same product point at the same file instead of generating
// duplicates.
export function getCanonicalProductSlug(proizvod) {
  return slugify(proizvod)
}

// Canonical, language-independent identity for a market (grad+pijaca pair),
// for the same reason as getCanonicalProductSlug.
export function getCanonicalMarketSlug(grad, pijaca) {
  return `${slugify(grad)}-${slugify(pijaca)}`
}

export { slugify }
