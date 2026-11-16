// Built-in copy of every translation key the suggestions form and its footer link
// introduced. A visitor whose browser still holds an older translation.json (or
// whose request for it fails) would otherwise see the raw key; i18next uses the
// defaultValue instead. These duplicate public/locales/{sr,en}/translation.json
// on purpose - when a text changes there, change it here too.
const FALLBACKS = {
  sr: {
    "footer.feedbackLink": "Predlozi i komentari",
    "feedback.title": "Predlozi i komentari",
    "feedback.seoDescription":
      "Pošaljite predlog ili komentar za sajt Cene sa pijace.",
    "feedback.nameLabel": "Ime (opciono)",
    "feedback.messageLabel": "Poruka (obavezno)",
    "feedback.minHint": "Najmanje {{min}} znakova",
    "feedback.verifying": "Provera u toku…",
    "feedback.retry": "Pokušaj ponovo",
    "feedback.counter": "{{count}} / {{max}}",
    "feedback.submit": "Pošalji",
    "feedback.sending": "Slanje...",
    "feedback.successTitle": "Hvala!",
    "feedback.successBody": "Vaša poruka je poslata.",
    "feedback.notePrivacy":
      "Poruke se koriste samo za poboljšanje sajta i ne prikazuju se javno.",
    "feedback.noteSources":
      "Cene preuzimamo iz zvaničnih izvora (STIPS i JKP Beogradske pijace) i ne možemo da ih menjamo.",
    "feedback.errors.nameLong": "Ime može imati najviše {{max}} znakova.",
    "feedback.errors.messageShort":
      "Poruka mora imati najmanje {{min}} znakova.",
    "feedback.errors.messageLong": "Poruka može imati najviše {{max}} znakova.",
    "feedback.errors.verification":
      "Sačekajte da se završi provera pa pokušajte ponovo.",
    "feedback.errors.tooMany":
      "Previše pokušaja. Pokušajte ponovo malo kasnije.",
    "feedback.errors.generic": "Nije uspelo, pokušaj ponovo kasnije.",
  },
  en: {
    "footer.feedbackLink": "Suggestions & comments",
    "feedback.title": "Suggestions & comments",
    "feedback.seoDescription":
      "Send a suggestion or comment about the Cene sa pijace website.",
    "feedback.nameLabel": "Name (optional)",
    "feedback.messageLabel": "Message (required)",
    "feedback.minHint": "At least {{min}} characters",
    "feedback.verifying": "Verifying…",
    "feedback.retry": "Try again",
    "feedback.counter": "{{count}} / {{max}}",
    "feedback.submit": "Send",
    "feedback.sending": "Sending...",
    "feedback.successTitle": "Thank you!",
    "feedback.successBody": "Your message has been sent.",
    "feedback.notePrivacy":
      "Messages are used only to improve the site and are not shown publicly; the name is optional.",
    "feedback.noteSources":
      "We take prices from official sources (STIPS and JKP Beogradske pijace) and cannot change them.",
    "feedback.errors.nameLong": "The name can have at most {{max}} characters.",
    "feedback.errors.messageShort":
      "The message must have at least {{min}} characters.",
    "feedback.errors.messageLong":
      "The message can have at most {{max}} characters.",
    "feedback.errors.verification":
      "Please wait for the check to finish and try again.",
    "feedback.errors.tooMany":
      "Too many attempts. Please try again a little later.",
    "feedback.errors.generic": "Something went wrong, please try again later.",
  },
};

// t() for these keys with the built-in text as defaultValue (Serbian for sr,
// English for en; anything else falls back to Serbian, like the app itself).
export function withFallback(t, language, key, vars = {}) {
  const table = FALLBACKS[language] ?? FALLBACKS.sr;
  return t(key, { defaultValue: table[key], ...vars });
}
