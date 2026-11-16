import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Cloudflare Pages Functions run without nodejs_compat: no Buffer, no process,
// no require, no node:* modules. The endpoint (and the shared rules it imports)
// must not use any of them.
test('source of the endpoint uses no Node-only APIs', () => {
  const files = [
    'functions/api/feedback.js',
    'functions/lib/feedback.js',
    'src/utils/feedbackRules.js',
    'functions/_middleware.js',
    'src/utils/seoCopy.js',
  ]
  const forbidden = /\bBuffer\b|\bprocess\b|\brequire\s*\(|from\s+['"]node:|createSign|createHmac|\.toString\(\s*['"]base64/
  for (const file of files) {
    // Comments may name them ("no Buffer, no process"); only code counts.
    const code = readFileSync(path.join(ROOT, file), 'utf8')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      .join('\n')
    assert.equal(forbidden.test(code), false, `${file} uses a Node-only API`)
  }
})

// Runs the whole flow in a fresh Node process in which Buffer, process and
// require are deleted first - Workers without nodejs_compat. The runner script
// builds its mocks from Web APIs only.
test('endpoint works with no global Buffer / process (Workers without nodejs_compat)', () => {
  const runner = path.join(ROOT, 'tests', 'helpers', 'workers-sim-run.mjs')
  assert.equal(statSync(runner).isFile(), true)
  const result = spawnSync(process.execPath, [runner], { encoding: 'utf8', cwd: ROOT, timeout: 60_000 })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  const report = JSON.parse(result.stdout.trim().split('\n').pop())
  assert.deepEqual(report, {
    hadBuffer: false,
    hadProcess: false,
    status: 200,
    body: { ok: true },
    appendCalls: 1,
    row: ['2026-11-16T10:20:30.000Z', 'Ana', 'Poruka iz Workers simulacije', '/grad/beograd', 'sr', 'novo'],
    signatureValid: true,
  })
})

test('helpers folder is not picked up as a test file', () => {
  assert.equal(readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.mjs')).length >= 4, true)
})
