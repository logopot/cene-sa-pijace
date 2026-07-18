const WEEK_LABEL_RE = /\((\d{2})\.(\d{2})\.(\d{4})-(\d{2})\.(\d{2})\.(\d{4})\)/
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/

// JKP archive rows carry a literal ISO Date (see scripts/jkp-scraper);
// reformat to the same Serbian DD.MM.YYYY. shape as formatWeekStartLabel
// so STIPS and JKP points render identical axis/tooltip labels.
export function formatIsoDateLabel(isoDate) {
  const match = isoDate?.match(ISO_DATE_RE)
  if (!match) return isoDate ?? ''
  const [, year, month, day] = match
  return `${day}.${month}.${year}.`
}

// Nedelja is STIPS's opaque week id, not a chronological week number (see
// stipsClient.js's resolveLatestWeek) - so "latest" must come from the date
// range embedded in NedeljaOpis, e.g. "27. (29.06.2026-05.07.2026)".
export function parseWeekEndTime(nedeljaOpis) {
  const match = nedeljaOpis?.match(WEEK_LABEL_RE)
  if (!match) return null
  const [, , , , endDay, endMonth, endYear] = match
  return new Date(Number(endYear), Number(endMonth) - 1, Number(endDay)).getTime()
}

// Chart axis label: just the week's start date, Serbian format with a
// trailing dot (e.g. "02.02.2026."), dropping the week number and parentheses.
export function formatWeekStartLabel(nedeljaOpis) {
  const match = nedeljaOpis?.match(WEEK_LABEL_RE)
  if (!match) return nedeljaOpis ?? ''
  const [, startDay, startMonth, startYear] = match
  return `${startDay}.${startMonth}.${startYear}.`
}

// Consumer-facing status badge label: a clean date range, dropping the
// opaque week number entirely (e.g. "29.06. – 05.07.2026.").
export function formatWeekRangeLabel(nedeljaOpis) {
  const match = nedeljaOpis?.match(WEEK_LABEL_RE)
  if (!match) return nedeljaOpis ?? ''
  const [, startDay, startMonth, , endDay, endMonth, endYear] = match
  return `${startDay}.${startMonth}. – ${endDay}.${endMonth}.${endYear}.`
}

// Resolves a row's chart time axis value, preferring a literal per-scrape
// Date (JKP archive rows, see scripts/jkp-scraper) over STIPS's
// week-range-embedded NedeljaOpis - lets the same chart/filtering logic
// plot and compare both datasets on one continuous timeline.
export function getRowTime(row) {
  if (row.Date) return new Date(row.Date).getTime()
  return parseWeekEndTime(row.NedeljaOpis)
}

// Axis/tooltip label counterpart to getRowTime.
export function getRowLabel(row) {
  if (row.Date) return formatIsoDateLabel(row.Date)
  return formatWeekStartLabel(row.NedeljaOpis)
}

// Status-badge counterpart to getRowTime - a JKP row has no "range", just
// the one date it was recorded on, so it's formatted to the same Serbian
// DD.MM.YYYY. notation rather than left as a raw ISO string.
export function getRowRangeLabel(row) {
  if (row.Date) return formatIsoDateLabel(row.Date)
  return formatWeekRangeLabel(row.NedeljaOpis)
}

// Shared by any view that needs "is this selection's latest week the same
// as the dataset's latest week" (see useMarketExplorer's fallback-week logic).
export function getLatestWeekTime(rows) {
  const times = rows.map(getRowTime).filter((time) => time !== null)
  return times.length === 0 ? null : Math.max(...times)
}
