import { normalizeDistrictLabel } from './market.js'
import { displayProductName } from './productNames.js'

// Looks up a raw Serbian data value (Trend, Poreklo, JedMere, Pakovanje,
// Ponuda, Proizvod, ...) in the active locale's dataValues dictionary via
// plain object lookup (not i18next's dot-path key resolution), so raw values
// containing "." (e.g. "Jabuka (Delišes ruž.)") can't be misread as nested
// keys. Falls back to the raw value when no translation exists (sr locale
// has no dataValues dictionary at all, so it always falls through to it).
// 'grad' additionally gets normalizeDistrictLabel applied here rather than
// at each of its many call sites, so every city/district label sitewide -
// filter dropdown, card subtitles, page headers - reads consistently without
// relying on every consumer to remember the extra step.
export function translateDataValue(t, field, raw) {
  if (raw === undefined || raw === null || raw === '') return raw
  const dict = t(`dataValues.${field}`, { returnObjects: true, defaultValue: {} })
  // Product names have their own complete English dictionary (see productNames.js).
  const value = field === 'proizvod' ? displayProductName(t.lng, raw, dict) : (dict[raw] ?? raw)
  return field === 'grad' ? normalizeDistrictLabel(value) : value
}
