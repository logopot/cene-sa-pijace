import marketInfo from '../data/marketInfo.json'

export function getMarketInfo(grad, pijaca) {
  return marketInfo[`${grad}|${pijaca}`] ?? null
}

// Ministry-sourced STIPS rows have no dedicated municipal operator entry in
// marketInfo.json, so they fall back to the STIPS ministry database itself
// as the attributed source.
export function getSourceLabel(grad, pijaca) {
  return getMarketInfo(grad, pijaca)?.sourceLabel ?? 'STIPS'
}
