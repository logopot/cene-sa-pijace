// Built-in copy of the chart note, used as i18next defaultValue so a browser still
// holding an older translation.json never shows a raw key. Duplicates
// public/locales/{sr,en}/translation.json on purpose - change both together.
export const CHART_FALLBACKS = {
  sr: { 'analytics.historyReferenceNote': 'Zelena linija je cena na veletržnici i služi za poređenje.' },
  en: { 'analytics.historyReferenceNote': 'The green line shows the wholesale market price for comparison.' },
}

export function chartDefault(language, key) {
  return (CHART_FALLBACKS[language] ?? CHART_FALLBACKS.sr)[key]
}
