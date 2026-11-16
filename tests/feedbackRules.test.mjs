import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateFeedback,
  isValidFromPath,
  sanitizeFromPath,
  cleanName,
  cleanMessage,
  protectFromFormula,
  pageTypeFromPath,
  NAME_MAX,
  MESSAGE_MIN,
  MESSAGE_MAX,
} from '../src/utils/feedbackRules.js'

const ok = (over = {}) => validateFeedback({ name: 'Ana', message: 'Odlican sajt, hvala', lang: 'sr', ...over })

test('message length bounds: 5..1000', () => {
  assert.equal(ok({ message: 'x'.repeat(MESSAGE_MIN - 1) }).ok, false)
  assert.equal(ok({ message: 'x'.repeat(MESSAGE_MIN) }).ok, true)
  assert.equal(ok({ message: 'x'.repeat(MESSAGE_MAX) }).ok, true)
  assert.deepEqual(ok({ message: 'x'.repeat(MESSAGE_MAX + 1) }).errors, ['message_long'])
  assert.equal(ok({ message: '    abc   ' }).ok, false, 'length is counted after trimming')
})

test('name is optional, at most 60 characters', () => {
  assert.equal(ok({ name: undefined }).value.name, '')
  assert.equal(ok({ name: '' }).ok, true)
  assert.equal(ok({ name: 'n'.repeat(NAME_MAX) }).ok, true)
  assert.deepEqual(ok({ name: 'n'.repeat(NAME_MAX + 1) }).errors, ['name_long'])
  assert.equal(ok({ name: 42 }).ok, false)
})

test('language must be sr or en', () => {
  assert.equal(ok({ lang: 'en' }).ok, true)
  assert.deepEqual(ok({ lang: 'de' }).errors, ['lang'])
  assert.equal(ok({ lang: undefined }).ok, false)
})

test('path rule: starts with /, <= 200 chars, path characters only; otherwise ignored', () => {
  assert.equal(isValidFromPath('/grad/novi-sad/kvantaska-pijaca'), true)
  assert.equal(isValidFromPath('/'), true)
  assert.equal(isValidFromPath('grad/x'), false)
  assert.equal(isValidFromPath('//evil.example'), false)
  assert.equal(isValidFromPath('/a?b=1'), false)
  assert.equal(isValidFromPath('/a#b'), false)
  assert.equal(isValidFromPath('/a b'), false)
  assert.equal(isValidFromPath('/<script>'), false)
  assert.equal(isValidFromPath('/' + 'a'.repeat(199)), true)
  assert.equal(isValidFromPath('/' + 'a'.repeat(200)), false)
  assert.equal(sanitizeFromPath('javascript:alert(1)'), '')
  assert.equal(ok({ path: '/grad/beograd' }).value.path, '/grad/beograd')
  assert.equal(ok({ path: 'nope' }).value.path, '')
  assert.equal(ok({}).value.path, '')
})

test('control characters are removed, spaces collapsed', () => {
  assert.equal(cleanName('  An\u0000a\u0007   \tIvić\n '), 'An a Ivić')
  assert.equal(cleanMessage('a\u0000b ‮  c\r\n\r\n\r\n\r\nd'), 'a b ‮ c\n\nd')
  assert.equal(cleanMessage('red 1\nred   2'), 'red 1\nred 2')
  assert.equal(ok({ message: 'ab\u0001cde' }).value.message, 'ab cde')
})

test('formula protection prefixes an apostrophe for = + - @', () => {
  for (const start of ['=', '+', '-', '@']) assert.equal(protectFromFormula(`${start}SUM(A1)`), `'${start}SUM(A1)`)
  assert.equal(protectFromFormula('normal'), 'normal')
  assert.equal(protectFromFormula(''), '')
})

test('page type for the GA4 event never exposes the path', () => {
  assert.equal(pageTypeFromPath('/'), 'home')
  assert.equal(pageTypeFromPath('/grad/beograd'), 'city')
  assert.equal(pageTypeFromPath('/grad/beograd/kalenic'), 'market')
  assert.equal(pageTypeFromPath('/city/beograd/green-market/vegetables'), 'category')
  assert.equal(pageTypeFromPath('/grad/a/b/c/d'), 'product')
  assert.equal(pageTypeFromPath('/disclaimer'), 'disclaimer')
  assert.equal(pageTypeFromPath('nope'), 'unknown')
})
