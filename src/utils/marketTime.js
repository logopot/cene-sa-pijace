import marketInfo from '../data/marketInfo.json'

export const MARKET_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  ALWAYS_OPEN: 'ALWAYS_OPEN',
  UNKNOWN: 'UNKNOWN',
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return hours * 60 + minutes
}

export function getMarketInfo(grad, pijaca) {
  return marketInfo[`${grad}|${pijaca}`] ?? null
}

// Ministry-sourced STIPS rows have no dedicated municipal operator entry in
// marketInfo.json, so they fall back to the STIPS ministry database itself
// as the attributed source.
export function getSourceLabel(grad, pijaca) {
  return getMarketInfo(grad, pijaca)?.sourceLabel ?? 'STIPS'
}

export function formatTodayHours(slot) {
  if (!slot) return null
  if (slot.open === '00:00' && slot.close === '24:00') return '00:00–24:00'
  return `${slot.open}–${slot.close}`
}

// Strips a redundant ":00" so a closing time reads e.g. "19" instead of
// "19:00", while keeping minutes when they matter (e.g. "19:30").
export function formatClosingTime(close) {
  const [hours, minutes] = close.split(':')
  return minutes === '00' ? hours : `${hours}:${minutes}`
}

// Reports today's slot against `now` (defaults to the real current time) -
// a slot of `{ open: "00:00", close: "24:00" }` means the market never
// closes that day, distinct from a plain open/close window.
export function getMarketStatus(grad, pijaca, now = new Date()) {
  const info = getMarketInfo(grad, pijaca)
  if (!info) return { status: MARKET_STATUS.UNKNOWN, info: null, slot: null }

  const slot = info.hours[DAY_KEYS[now.getDay()]]
  if (!slot) return { status: MARKET_STATUS.CLOSED, info, slot: null }

  if (slot.open === '00:00' && slot.close === '24:00') {
    return { status: MARKET_STATUS.ALWAYS_OPEN, info, slot }
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = toMinutes(slot.open)
  const closeMinutes = slot.close === '24:00' ? 24 * 60 : toMinutes(slot.close)

  if (nowMinutes >= openMinutes && nowMinutes < closeMinutes) {
    return { status: MARKET_STATUS.OPEN, info, slot }
  }
  return { status: MARKET_STATUS.CLOSED, info, slot: null }
}
