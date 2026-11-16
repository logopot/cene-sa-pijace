// Official sites of the two sources the prices come from. Only these two get a
// link (and the click_source_link event); a municipal operator with no known
// address in the data (e.g. a local JKP) stays plain text.
const SOURCES = {
  stips: { url: 'https://www.stips.minpolj.gov.rs' },
  jkp: { url: 'https://www.bgpijace.rs' },
}

// `label` is the row's source text: "STIPS" or "JKP Beogradske pijace".
// Returns { key: 'stips' | 'jkp', url } or null.
export function getSourceLink(label) {
  if (typeof label !== 'string') return null
  const text = label.trim().toLowerCase()
  if (text === 'stips') return { key: 'stips', ...SOURCES.stips }
  if (text.includes('beogradske pijace')) return { key: 'jkp', ...SOURCES.jkp }
  return null
}
