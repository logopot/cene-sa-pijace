// Built-in copy of the texts introduced with the new "biggest price drops" rules,
// used as i18next defaultValue so a browser still holding an older translation.json
// never shows a raw key. They duplicate public/locales/{sr,en}/translation.json on
// purpose - when a text changes there, change it here too.
export const WEEKLY_DROP_FALLBACKS = {
  sr: {
    'weeklyTrends.subtitle': 'Proizvodi sa najvećim padom cene u odnosu na prethodnu nedelju.',
    'productCard.dropPercent': 'pad cene −{{percent}}%',
  },
  en: {
    'weeklyTrends.subtitle': 'Products with the biggest price drop compared with the previous week.',
    'productCard.dropPercent': 'price drop −{{percent}}%',
  },
}

export function weeklyDropDefault(language, key) {
  return (WEEKLY_DROP_FALLBACKS[language] ?? WEEKLY_DROP_FALLBACKS.sr)[key]
}
