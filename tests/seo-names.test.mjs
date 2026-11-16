import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { cityInMarketName, placeLabel, placeWithComma, productCopy, marketCopyWithoutCity } from '../src/utils/seoCopy.js'
import { PRODUCT_NAMES_EN } from '../src/data/productNamesEn.js'
import { displayProductName, untranslatedProductNames } from '../src/utils/productNames.js'
import { getProductUrlSlug } from '../scripts/lib/productLabels.mjs'

const locale = JSON.parse(readFileSync(new URL('../public/locales/en/translation.json', import.meta.url), 'utf8'))

test('city already in the market name: whole words, any case, any accent', () => {
  assert.equal(cityInMarketName('TC Novi Beograd', 'Beograd'), true)
  assert.equal(cityInMarketName('tc novi beograd', 'BEOGRAD'), true)
  assert.equal(cityInMarketName('Pijaca Niš', 'Nis'), true)
  assert.equal(cityInMarketName('Pijaca Nis', 'Niš'), true)
  assert.equal(cityInMarketName('Đurđevo pijaca', 'Djurdjevo'), true)
  assert.equal(cityInMarketName('Novi Sad pijaca', 'Novi Sad'), true)
  assert.equal(cityInMarketName('Kikinda', 'Kikinda'), true)
  // not whole words / not there
  assert.equal(cityInMarketName('Zelena pijaca', 'Niš'), false)
  assert.equal(cityInMarketName('Niška pijaca', 'Niš'), false)
  assert.equal(cityInMarketName('Beogradska tržnica', 'Beograd'), false)
  assert.equal(cityInMarketName('Kalenić', 'Beograd'), false)
  assert.equal(cityInMarketName('Kalenić', ''), false)
})

test('placeLabel / placeWithComma add the city only when it is not already there', () => {
  assert.equal(placeLabel('TC Novi Beograd', 'Beograd'), 'TC Novi Beograd')
  assert.equal(placeLabel('Kalenić', 'Beograd'), 'Kalenić Beograd')
  assert.equal(placeWithComma('TC Novi Beograd', 'Beograd'), 'TC Novi Beograd')
  assert.equal(placeWithComma('Kalenić', 'Beograd'), 'Kalenić, Beograd')
})

test('product copy: no repeated city, limits kept (sr and en)', () => {
  const facts = { name: 'Paradajz', market: 'TC Novi Beograd', city: 'Beograd', min: 300, max: 350, unit: 'kg', source: 'JKP Beogradske pijace', date: '12.11.2026.' }
  const sr = productCopy('sr', facts)
  assert.equal(sr.title, 'Paradajz cena – TC Novi Beograd')
  assert.equal(sr.description.includes('Beograd Beograd'), false)
  const en = productCopy('en', { ...facts, name: 'Tomato' })
  assert.equal(en.title, 'Tomato price – TC Novi Beograd')
  assert.equal(en.description, 'Tomato: current price from 300 to 350 RSD per kg at TC Novi Beograd. Source: JKP Beogradske pijace, 12.11.2026.')
  // A market without the city keeps it, and a variant still fits where the city is absent.
  assert.equal(productCopy('en', { ...facts, name: 'Tomato', market: 'Kalenić' }).title, 'Tomato price – Kalenić (Beograd)')
  assert.equal(productCopy('en', { ...facts, name: 'Tomato', variant: 'Fruit' }).title, 'Tomato price – TC Novi Beograd (Fruit)')
  for (const p of [sr, en]) {
    assert.ok(p.title.length <= 60)
    assert.ok(p.description.length <= 155)
  }
})

test('market copy without the city', () => {
  assert.deepEqual(marketCopyWithoutCity({ lang: 'sr', market: 'TC Novi Beograd', generic: false }), {
    title: 'Pijaca TC Novi Beograd - Pregled aktuelnih cena',
    description: 'Sveže cene proizvoda na pijaci TC Novi Beograd. Proverite ponudu pre odlaska u kupovinu.',
  })
})

test('English display dictionary: covers every locale-dictionary name and reads as English', () => {
  // The display names may differ from the locale file's (which only feeds URL
  // slugs), but no name the locale file knows may be missing here.
  for (const serbian of Object.keys(locale.dataValues.proizvod)) {
    assert.ok(serbian in PRODUCT_NAMES_EN, `missing display name for ${serbian}`)
  }
  for (const [serbian, english] of Object.entries(PRODUCT_NAMES_EN)) {
    assert.ok(english.trim() !== '', serbian)
    // Only a Serbian variety name (a proper noun) may keep its letters.
    const properNoun = english === 'Beans (white, Gradištanac)'
    assert.equal(properNoun || /[čćšžđČĆŠŽĐ]/.test(english), properNoun, `Serbian letters left in "${english}"`)
    assert.notEqual(english, serbian)
  }
})

test('every product name in the data has an English name (when the data files exist)', () => {
  const latest = new URL('../public/data/latest.json', import.meta.url)
  if (!existsSync(latest)) return
  const { columns, rows } = JSON.parse(readFileSync(latest, 'utf8'))
  const index = columns.indexOf('Proizvod')
  assert.deepEqual(untranslatedProductNames(rows.map((row) => row[index])), [])
})

test('displayProductName: English from the dictionary, fallbacks to locale then Serbian; Serbian untouched', () => {
  assert.equal(displayProductName('en', 'Grožđe (crno Hamburg)'), 'Grapes (Black Hamburg)')
  assert.equal(displayProductName('en', 'Nepoznat proizvod'), 'Nepoznat proizvod')
  assert.equal(displayProductName('en', 'Nepoznat proizvod', { 'Nepoznat proizvod': 'Unknown' }), 'Unknown')
  assert.equal(displayProductName('sr', 'Grožđe (crno Hamburg)'), 'Grožđe (crno Hamburg)')
  assert.deepEqual(untranslatedProductNames(['Kupus', 'Nešto novo', 'Nešto novo ']), ['Nešto novo'])
})

test('URL slugs do not follow the display names (they come from the locale dictionary)', () => {
  assert.equal(getProductUrlSlug('Kupus', 'en'), 'kupus')
  assert.equal(getProductUrlSlug('Grožđe (crno Hamburg)', 'en'), 'grozdje-crno-hamburg')
  assert.equal(getProductUrlSlug('Kupus (sve sorte)', 'en'), 'cabbage-all-varieties')
  assert.equal(getProductUrlSlug('Kupus (sve sorte)', 'sr'), 'kupus-sve-sorte')
  // Renamed display names (garlic, onion, medlar, peppers) keep their old URLs.
  assert.equal(getProductUrlSlug('Luk beli (sve sorte)', 'en'), 'white-onion-all-varieties')
  assert.equal(getProductUrlSlug('Luk crni (sve sorte)', 'en'), 'yellow-onion-all-varieties')
  assert.equal(getProductUrlSlug('Mušmula (sve sorte)', 'en'), 'loquat-all-varieties')
  assert.equal(getProductUrlSlug('Paprika (ljuta)', 'en'), 'pepper-hot')
})
