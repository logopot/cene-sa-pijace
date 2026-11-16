import { MESSAGE_MIN, MESSAGE_MAX, cleanMessage, textLength } from './feedbackRules.js'

// What the suggestions form may do, computed from its inputs alone (the form
// component only renders this). `verify` is the state of the Turnstile check:
//   'idle'        not started (the widget stays hidden and does nothing)
//   'running'     started with turnstile.execute, waiting for the answer
//   'interactive' Cloudflare asked for a click ("Confirm you are human")
//   'done'        a token was issued (hasToken is true)
//   'error'       the check failed or timed out
//
// - messageValid: 5..1000 characters AFTER trimming/cleaning (spaces only = 0).
// - shouldExecute: the check starts the first time the message is valid, once -
//   not while one is running, not when a token is already held, not before the
//   widget exists, not after an error until the visitor retries/edits.
// - verifying: the "Verifying..." note - a valid message with no token yet and no
//   failure.
// - canSubmit: valid message AND a token, and nothing is being sent. The token
//   outlives a later deletion of the text (it only expires with time), but the
//   button is off while the message is short.
export function getFormState({ message, hasToken, verify, sending = false, widgetReady = true }) {
  const length = textLength(cleanMessage(message))
  const messageValid = length >= MESSAGE_MIN && length <= MESSAGE_MAX
  return {
    length,
    messageValid,
    canSubmit: messageValid && hasToken && !sending,
    shouldExecute: messageValid && widgetReady && verify === 'idle' && !hasToken,
    verifying: messageValid && !hasToken && (verify === 'idle' || verify === 'running' || verify === 'interactive'),
    // The widget area exists only once a check has been started.
    showWidget: verify !== 'idle',
    showRetry: verify === 'error',
  }
}
