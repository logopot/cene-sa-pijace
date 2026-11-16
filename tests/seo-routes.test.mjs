import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStaticEntries, buildSitemap } from '../scripts/generate-seo-map.mjs'

test('feedback routes are known (manifest), noindex, no hreflang pair, not in the sitemap', () => {
  const entries = buildStaticEntries()
  for (const [path, lang] of [
    ['/predlozi', 'sr'],
    ['/feedback', 'en'],
  ]) {
    assert.equal(entries[path].type, 'feedback')
    assert.equal(entries[path].lang, lang)
    assert.equal(entries[path].noindex, 1)
    assert.equal(entries[path].alt, undefined)
  }
  const sitemap = buildSitemap(entries)
  assert.equal(sitemap.includes('/predlozi'), false)
  assert.equal(sitemap.includes('/feedback'), false)
  assert.equal(sitemap.includes('/odricanje-od-odgovornosti'), true)
})
