export const STORAGE_KEY = 'cene-sa-pijace:filters'

// True when the visitor has a saved city/category/market selection. The
// prerendered homepage shows an empty search bar, so a visitor with a saved
// selection can't take over that markup as-is (see src/main.jsx).
export function hasStoredSelection() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return Boolean(parsed.grad || parsed.category || parsed.pijaca)
  } catch {
    return false
  }
}
