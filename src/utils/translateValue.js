// Looks up a raw Serbian data value (Trend, Poreklo, JedMere, Pakovanje,
// Ponuda, Proizvod, ...) in the active locale's dataValues dictionary via
// plain object lookup (not i18next's dot-path key resolution), so raw values
// containing "." (e.g. "Jabuka (Delišes ruž.)") can't be misread as nested
// keys. Falls back to the raw value when no translation exists (sr locale
// has no dataValues dictionary at all, so it always falls through to it).
export function translateDataValue(t, field, raw) {
  if (raw === undefined || raw === null || raw === '') return raw
  const dict = t(`dataValues.${field}`, { returnObjects: true, defaultValue: {} })
  return dict[raw] ?? raw
}
