// Rules of the suggestions/comments form, with NO imports so the exact same code
// validates in the browser (src/pages/Feedback) and on the server
// (functions/lib/feedback.js) - what the form accepts and what the endpoint
// accepts can never drift apart.

export const NAME_MAX = 60
export const MESSAGE_MIN = 5
export const MESSAGE_MAX = 1000
export const FROM_MAX = 200
export const FEEDBACK_LANGUAGES = ['sr', 'en']

// Path characters only (RFC 3986 pchar + "/"): no query, no fragment, no spaces,
// no backslash, no angle brackets or quotes.
const PATH_PATTERN = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/

// A page path the form may remember as "where the visitor came from": starts
// with "/", at most FROM_MAX characters, only path characters. "//..." is out
// (it would read as a protocol-relative URL). Anything else is ignored by the
// callers, never an error.
export function isValidFromPath(value) {
  return (
    typeof value === 'string' &&
    value.length <= FROM_MAX &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    PATH_PATTERN.test(value)
  )
}

export function sanitizeFromPath(value) {
  return isValidFromPath(value) ? value : ''
}

// Control characters (C0, DEL, C1) and the Unicode line/paragraph separators.
// eslint-disable-next-line no-control-regex
const CONTROL_ANY = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g
// Same, but keeps "\n" - the message may have line breaks.
// eslint-disable-next-line no-control-regex
const CONTROL_EXCEPT_NEWLINE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/g

// "Ime": one line, control characters removed, runs of spaces collapsed.
export function cleanName(value) {
  return String(value ?? '')
    .replace(CONTROL_ANY, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// "Poruka": line breaks kept (at most one blank line in a row), control
// characters removed, runs of spaces collapsed, edges trimmed.
export function cleanMessage(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_EXCEPT_NEWLINE, ' ')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Length in characters a person would count (an emoji is one, not two).
export function textLength(value) {
  return Array.from(value).length
}

// A cell that starts with = + - @ would be run as a formula by Sheets; a leading
// apostrophe makes it plain text (with valueInputOption=RAW it stays visible as
// a literal apostrophe, which is the accepted price of the protection).
export function protectFromFormula(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

// Validates and cleans the visitor's input. Returns { ok: true, value } with the
// cleaned fields, or { ok: false, errors } with machine codes the form maps to
// its own translated messages.
export function validateFeedback(input) {
  const errors = []
  const raw = input && typeof input === 'object' ? input : {}

  if (raw.name !== undefined && raw.name !== null && typeof raw.name !== 'string') errors.push('name_type')
  if (typeof raw.message !== 'string') errors.push('message_type')
  if (errors.length > 0) return { ok: false, errors }

  const name = cleanName(raw.name)
  const message = cleanMessage(raw.message)
  const lang = raw.lang

  if (textLength(name) > NAME_MAX) errors.push('name_long')
  if (textLength(message) < MESSAGE_MIN) errors.push('message_short')
  if (textLength(message) > MESSAGE_MAX) errors.push('message_long')
  if (!FEEDBACK_LANGUAGES.includes(lang)) errors.push('lang')
  if (errors.length > 0) return { ok: false, errors }

  return { ok: true, value: { name, message, path: sanitizeFromPath(raw.path), lang } }
}

// Coarse kind of page the visitor came from, for the GA4 "feedback_open" event
// - never the path itself, so no product or market name leaves the site.
export function pageTypeFromPath(path) {
  if (!isValidFromPath(path)) return 'unknown'
  if (path === '/') return 'home'
  const segments = path.split('/').filter(Boolean)
  if (segments[0] === 'odricanje-od-odgovornosti' || segments[0] === 'disclaimer') return 'disclaimer'
  if (segments[0] === 'predlozi' || segments[0] === 'feedback') return 'feedback'
  if (segments[0] === 'grad' || segments[0] === 'city') {
    return ['city', 'market', 'category', 'product'][segments.length - 2] ?? 'other'
  }
  return 'other'
}
