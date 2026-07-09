const COUNTRY_KEYWORDS = ['albanija', 'grčka', 'turska', 'makedonija', 'italija']
const PACKAGING_KEYWORDS = ['folija', 'gajba', 'kutija', 'kesa']

// STIPS's free-text Komentar field sometimes holds a single classifiable
// word (an import country or an extra packaging note) rather than genuine
// free-form commentary - detect that case so it can be shown as structured
// metadata instead of a stray italic line.
export function classifyComment(komentar) {
  if (!komentar) return null
  const normalized = komentar.trim().toLowerCase()
  if (COUNTRY_KEYWORDS.includes(normalized)) return { type: 'country', value: normalized }
  if (PACKAGING_KEYWORDS.includes(normalized)) return { type: 'packaging', value: normalized }
  return { type: 'text', value: komentar.trim() }
}
