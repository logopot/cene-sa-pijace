import test from 'node:test'
import assert from 'node:assert/strict'
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import {
  CITY_PATH_PREFIX,
  DISCLAIMER_PATH,
  FEEDBACK_PATH,
  getRouteLanguage,
} from '../src/constants/routeLocales.js'
import { createI18nOptions } from '../src/utils/i18nOptions.js'

test('every path of routeLocales.js maps to its own language', () => {
  for (const [language, prefix] of Object.entries(CITY_PATH_PREFIX)) {
    assert.equal(getRouteLanguage(`/${prefix}`), language)
    assert.equal(getRouteLanguage(`/${prefix}/beograd`), language)
    assert.equal(getRouteLanguage(`/${prefix}/beograd/kalenic`), language)
    assert.equal(getRouteLanguage(`/${prefix}/beograd/kalenic/povrce`), language)
    assert.equal(getRouteLanguage(`/${prefix}/beograd/kalenic/povrce/kupus`), language)
  }
  for (const [language, path] of Object.entries(DISCLAIMER_PATH)) assert.equal(getRouteLanguage(path), language)
  for (const [language, path] of Object.entries(FEEDBACK_PATH)) assert.equal(getRouteLanguage(path), language)
  assert.equal(getRouteLanguage('/grad/novi-sad/kvantaska-pijaca'), 'sr')
  assert.equal(getRouteLanguage('/city/novi-sad/wholesale-market/vegetables/garlic'), 'en')
  assert.equal(getRouteLanguage('/predlozi'), 'sr')
  assert.equal(getRouteLanguage('/odricanje-od-odgovornosti'), 'sr')
  assert.equal(getRouteLanguage('/feedback'), 'en')
  assert.equal(getRouteLanguage('/disclaimer'), 'en')
})

test('paths with no language of their own: homepage, unknown, look-alikes', () => {
  for (const path of ['/', '', '/nesto', '/gradovi', '/cityscape', '/grad2/x', '/predlozi/', '/feedback/x', '/api/feedback', undefined, null, 42]) {
    assert.equal(getRouteLanguage(path), null, String(path))
  }
})

// Builds an i18n instance the way the app does (same options and detector), with
// the translations inline instead of the HTTP backend, against a fake localStorage.
async function languageOn(pathname, storage) {
  globalThis.window = { localStorage: { getItem: (k) => storage[k] ?? null, setItem: (k, v) => (storage[k] = String(v)), removeItem: (k) => delete storage[k] } }
  const { backend, ...options } = createI18nOptions(pathname)
  void backend
  const instance = i18next.createInstance().use(LanguageDetector)
  await instance.init({ ...options, resources: { sr: { translation: {} }, en: { translation: {} } }, initAsync: false })
  return { language: instance.language, storage }
}

const EMPTY = () => ({})
const FORCED_SR = () => ({ i18nextLng: 'sr', i18n_forced_sr_v1: 'true' })
const SAVED_EN = () => ({ i18nextLng: 'en', i18n_forced_sr_v1: 'true' })

test('English addresses stay English with empty storage and with the forced "sr"', async () => {
  for (const path of ['/city/beograd/wholesale-market/vegetables/garlic-all-varieties', '/city/beograd/kalenic', '/city/beograd/kalenic/vegetables', '/city/beograd', '/feedback', '/disclaimer']) {
    assert.equal((await languageOn(path, EMPTY())).language, 'en', `empty storage ${path}`)
    assert.equal((await languageOn(path, FORCED_SR())).language, 'en', `forced sr ${path}`)
  }
})

test('Serbian addresses stay Serbian whatever is saved', async () => {
  for (const path of ['/grad/beograd/kvantaska-pijaca/povrce/luk-beli-sve-sorte', '/grad/beograd', '/predlozi', '/odricanje-od-odgovornosti']) {
    assert.equal((await languageOn(path, EMPTY())).language, 'sr', `empty ${path}`)
    assert.equal((await languageOn(path, FORCED_SR())).language, 'sr', `forced sr ${path}`)
    assert.equal((await languageOn(path, SAVED_EN())).language, 'sr', `saved en ${path}`)
  }
})

test('the homepage keeps the old behaviour: saved choice, else Serbian', async () => {
  assert.equal((await languageOn('/', EMPTY())).language, 'sr')
  assert.equal((await languageOn('/', FORCED_SR())).language, 'sr')
  assert.equal((await languageOn('/', SAVED_EN())).language, 'en')
})

test('the route language is never written to storage (it must not become a saved choice)', async () => {
  const storage = FORCED_SR()
  await languageOn('/city/beograd', storage)
  assert.equal(storage.i18nextLng, 'sr')
  const home = EMPTY()
  await languageOn('/feedback', home)
  assert.deepEqual(home, {})
})
