import test from 'node:test'
import assert from 'node:assert/strict'
import { getFormState } from '../src/utils/feedbackFormState.js'

const state = (over = {}) => getFormState({ message: 'x'.repeat(5), hasToken: false, verify: 'idle', ...over })

test('message length rules: empty, spaces only, 4, 5, 1000, 1001', () => {
  assert.equal(state({ message: '' }).messageValid, false)
  assert.equal(state({ message: '      ' }).messageValid, false)
  assert.equal(state({ message: '  abc \n ' }).messageValid, false, 'counted after trimming')
  assert.equal(state({ message: 'x'.repeat(4) }).messageValid, false)
  assert.equal(state({ message: 'x'.repeat(5) }).messageValid, true)
  assert.equal(state({ message: '  ' + 'x'.repeat(5) + '  ' }).messageValid, true)
  assert.equal(state({ message: 'x'.repeat(1000) }).messageValid, true)
  assert.equal(state({ message: 'x'.repeat(1001) }).messageValid, false)
  assert.equal(state({ message: 'x'.repeat(4) }).length, 4)
})

test('the check starts only for a valid message, once, and only when it can', () => {
  assert.equal(state({ message: 'abcd' }).shouldExecute, false, 'too short')
  assert.equal(state({ message: '     ' }).shouldExecute, false, 'spaces only')
  assert.equal(state().shouldExecute, true, 'valid, idle, no token')
  assert.equal(state({ widgetReady: false }).shouldExecute, false, 'widget not rendered yet')
  assert.equal(state({ verify: 'running' }).shouldExecute, false, 'already running')
  assert.equal(state({ verify: 'interactive' }).shouldExecute, false)
  assert.equal(state({ verify: 'done', hasToken: true }).shouldExecute, false)
  assert.equal(state({ hasToken: true }).shouldExecute, false, 'a token is already held')
  assert.equal(state({ verify: 'error' }).shouldExecute, false, 'after a failure only a retry/edit restarts it')
})

test('submit needs a valid message AND a token, and nothing being sent', () => {
  assert.equal(state({ hasToken: true, verify: 'done' }).canSubmit, true)
  assert.equal(state({ hasToken: false }).canSubmit, false, 'no token')
  assert.equal(state({ message: 'abcd', hasToken: true, verify: 'done' }).canSubmit, false, 'short message')
  assert.equal(state({ message: 'x'.repeat(1001), hasToken: true, verify: 'done' }).canSubmit, false)
  assert.equal(state({ hasToken: true, verify: 'done', sending: true }).canSubmit, false)
})

test('deleting the text below 5 characters switches the button off but keeps the token', () => {
  const valid = state({ hasToken: true, verify: 'done' })
  assert.equal(valid.canSubmit, true)
  const deleted = state({ message: 'ab', hasToken: true, verify: 'done' })
  assert.equal(deleted.canSubmit, false)
  assert.equal(deleted.shouldExecute, false, 'no second check for the token already held')
  // Typed again: enabled at once, still no new check.
  const retyped = state({ message: 'abcdef', hasToken: true, verify: 'done' })
  assert.equal(retyped.canSubmit, true)
  assert.equal(retyped.shouldExecute, false)
})

test('expiry: token gone, state back to idle - the check runs again while the message is valid', () => {
  const expired = state({ hasToken: false, verify: 'idle' })
  assert.equal(expired.canSubmit, false, 'no token, button off')
  assert.equal(expired.shouldExecute, true)
  assert.equal(state({ message: 'ab', hasToken: false, verify: 'idle' }).shouldExecute, false, 'message no longer valid: no check')
})

test('"Verifying..." shows for a valid message waiting for its token, not otherwise', () => {
  assert.equal(state().verifying, true)
  assert.equal(state({ verify: 'running' }).verifying, true)
  assert.equal(state({ verify: 'interactive' }).verifying, true)
  assert.equal(state({ message: 'abc' }).verifying, false)
  assert.equal(state({ hasToken: true, verify: 'done' }).verifying, false)
  assert.equal(state({ verify: 'error' }).verifying, false)
})

test('widget area is hidden until a check starts; retry is offered after an error', () => {
  assert.equal(state().showWidget, false)
  assert.equal(state({ message: '' }).showWidget, false)
  for (const verify of ['running', 'interactive', 'done', 'error']) assert.equal(state({ verify }).showWidget, true, verify)
  assert.equal(state({ verify: 'error' }).showRetry, true)
  assert.equal(state({ verify: 'running' }).showRetry, false)
})
