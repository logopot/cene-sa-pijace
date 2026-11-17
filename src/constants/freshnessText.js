// Built-in copy of the texts of the freshness feature, used as i18next defaultValue
// so a browser still holding an older translation.json never shows a raw key.
// Duplicates public/locales/{sr,en}/translation.json on purpose - change both together.
export const FRESHNESS_FALLBACKS = {
  sr: {
    'productCard.lastPrice': 'Poslednja cena: {{date}}',
    'analytics.noCurrentData': 'Nema aktuelnih podataka. Poslednja cena: {{date}}.',
    'analytics.lastPriceOn': 'Poslednja cena: {{date}}',
    'results.noCurrentData': 'Nema aktuelnih podataka.',
  },
  en: {
    'productCard.lastPrice': 'Last price: {{date}}',
    'analytics.noCurrentData': 'No current data. Last price: {{date}}.',
    'analytics.lastPriceOn': 'Last price: {{date}}',
    'results.noCurrentData': 'No current data.',
  },
}

export function freshnessDefault(language, key) {
  return (FRESHNESS_FALLBACKS[language] ?? FRESHNESS_FALLBACKS.sr)[key]
}
