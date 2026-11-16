import { isFeedbackPath } from '../constants/routeLocales.js'
import { FROM_MAX, isValidFromPath } from './feedbackRules.js'

// The page a visitor was on before opening the suggestions form: the form asks
// for it instead of the footer link carrying it in the URL. Only the PATHNAME of
// the last visited page that is not the form itself - no query, no hash, at most
// FROM_MAX characters - kept in sessionStorage (so it survives a refresh of the
// form) with an in-memory fallback when storage is unavailable. document.referrer
// is never used.
const STORAGE_KEY = 'lr'

let memory = ''

// What may be remembered for a pathname, or '' when nothing should be.
export function normalizeRoute(pathname) {
  if (typeof pathname !== 'string') return ''
  const path = pathname.split(/[?#]/)[0].slice(0, FROM_MAX)
  if (!isValidFromPath(path) || isFeedbackPath(path)) return ''
  return path
}

export function rememberRoute(pathname) {
  const path = normalizeRoute(pathname)
  if (!path) return
  memory = path
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    // Storage blocked or full: the in-memory copy still serves this page load.
  }
}

// The remembered page, re-checked on the way out (storage is user-editable).
export function readLastRoute() {
  try {
    const stored = normalizeRoute(window.sessionStorage.getItem(STORAGE_KEY) ?? '')
    if (stored) return stored
  } catch {
    // Storage unavailable: fall back to memory.
  }
  return memory
}

// For tests: forget everything.
export function resetLastRoute() {
  memory = ''
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}
