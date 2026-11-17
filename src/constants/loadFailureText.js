// Built-in copy of the "page could not be loaded" texts, used as i18next defaultValue.
// This message appears exactly when something failed to load, so it must not depend
// on a translation file that may be the very thing that is stale. Duplicates
// public/locales/{sr,en}/translation.json on purpose - change both together.
export const LOAD_FAILURE_FALLBACKS = {
  sr: { 'loadFailure.message': 'Stranica nije mogla da se učita. Osvežite stranicu.', 'loadFailure.reload': 'Osveži' },
  en: { 'loadFailure.message': 'The page could not be loaded. Please refresh.', 'loadFailure.reload': 'Refresh' },
}

export function loadFailureDefault(language, key) {
  return (LOAD_FAILURE_FALLBACKS[language] ?? LOAD_FAILURE_FALLBACKS.sr)[key]
}
