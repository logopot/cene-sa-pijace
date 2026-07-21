import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767px)'

function subscribe(callback) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return false
}

// Mirrors the 768px breakpoint used throughout the app's CSS (see
// theme.js/media queries in .styled.js files) - only needed where a layout
// decision can't be expressed in CSS alone, e.g. Recharts' layout prop,
// which Recharts bakes into the chart's own SVG geometry rather than
// something a media query could override after the fact.
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
