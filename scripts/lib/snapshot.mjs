// Builds the static HTML snapshots (public/snap/**.html) that
// functions/_middleware.js injects into the SPA shell's #snapshot container,
// so crawlers and no-JS visitors get real prices in the first HTML response.
// The React app removes the container as soon as it has rendered the same
// content itself (see src/App.jsx), so humans only ever see it for the
// moment before JS finishes - hence the card look in index.html's #snapshot
// styles mirrors ProductCard rather than being a bare list.
import { getDisplayPrice, formatDisplayPrice } from '../../src/utils/price.js'
import { isBlank } from '../../src/utils/blank.js'
import { resolveUnit } from '../../src/utils/unit.js'
import { spaceBeforeParens } from '../../src/utils/formatText.js'
import { getRowTime } from '../../src/utils/week.js'
import { parseMesto } from '../../src/utils/market.js'
import { translateDataValue } from './productLabels.mjs'
import { readJsonFile } from './googleSheets.mjs'

const MARKET_INFO = readJsonFile('src/data/marketInfo.json')
const LOCALES = {
  sr: readJsonFile('public/locales/sr/translation.json'),
  en: readJsonFile('public/locales/en/translation.json'),
}

const KNOWN_TRENDS = new Set(['rast', 'pad', 'bez promene'])
const TREND_MARK = { rast: '↑', pad: '↓', 'bez promene': '-' }

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

// Plain dot-path lookup + {{var}} interpolation against the real locale
// files, so snapshot copy can never drift from the app's own translations.
export function tr(lang, key, vars = {}) {
  const raw = key.split('.').reduce((node, part) => node?.[part], LOCALES[lang] ?? LOCALES.sr) ?? ''
  return String(raw).replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? '')
}

function getSourceLabel(row, grad, pijaca) {
  return row.Source || MARKET_INFO[`${grad}|${pijaca}`]?.sourceLabel || 'STIPS'
}

// One <li> per priced row. Empty secondary attributes are skipped entirely
// (same rule as the live ProductCard), never replaced with a placeholder.
export function renderCard(row, lang, href, { compact = false } = {}) {
  const { grad, pijaca } = parseMesto(row.Mesto)
  const name = translateDataValue(lang, 'proizvod', row.Proizvod)
  const place = `${translateDataValue(lang, 'pijaca', pijaca)}, ${translateDataValue(lang, 'grad', grad)}`
  const unit = translateDataValue(lang, 'jedMere', resolveUnit(row.JedMere, row.Kategorija))
  const priceText = formatDisplayPrice(getDisplayPrice(row))
  const price = priceText ? `${priceText} ${unit ? tr(lang, 'productCard.priceUnit', { unit }) : tr(lang, 'productCard.priceNoUnit')}` : ''

  const facts = compact ? '' : [
    ['productCard.packaging', translateDataValue(lang, 'pakovanje', resolveUnit(row.Pakovanje, row.Kategorija))],
    ['productCard.origin', spaceBeforeParens(translateDataValue(lang, 'poreklo', row.Poreklo))],
    ['productCard.offer', translateDataValue(lang, 'ponuda', row.Ponuda)],
  ]
    .filter(([, value]) => !isBlank(value))
    .map(([key, value]) => `<span>${escapeHtml(tr(lang, key))}: ${escapeHtml(value)}</span>`)
    .join('')

  const trend = !compact && KNOWN_TRENDS.has(row.Trend)
    ? `<span class="snap-trend snap-trend-${row.Trend === 'bez promene' ? 'flat' : row.Trend}">${TREND_MARK[row.Trend]} ${escapeHtml(translateDataValue(lang, 'trend', row.Trend))}</span>`
    : ''

  const title = href
    ? `<a href="${escapeHtml(href)}">${escapeHtml(name)}</a>`
    : escapeHtml(name)

  return [
    '<li class="snap-card">',
    `<strong class="snap-name">${title}</strong>`,
    `<span class="snap-place">${escapeHtml(place)}</span>`,
    price ? `<span class="snap-price">${escapeHtml(price)}</span>` : '',
    facts ? `<span class="snap-facts">${facts}</span>` : '',
    `<span class="snap-foot"><span>${escapeHtml(tr(lang, 'productCard.source', { source: getSourceLabel(row, grad, pijaca) }))}</span>${trend}</span>`,
    '</li>',
  ].join('')
}

function page({ lang, heading, intro = '', sections }) {
  const body = sections
    .filter(Boolean)
    .map(({ title, html }) => `<section>${title ? `<h2>${escapeHtml(title)}</h2>` : ''}${html}</section>`)
    .join('')
  return [
    '<header class="snap-head"><a href="/" class="snap-logo">Cene sa pijace</a></header>',
    `<main class="snap-main" lang="${lang}">`,
    `<h1>${escapeHtml(heading)}</h1>`,
    intro ? `<p class="snap-intro">${escapeHtml(intro)}</p>` : '',
    body,
    '</main>',
  ].join('')
}

export const cardList = (cards) => `<ul class="snap-grid">${cards.join('')}</ul>`
export const linkList = (links) =>
  `<ul class="snap-links">${links.map(({ href, label }) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul>`

// A market's products at that market's own latest reporting time - mirrors
// src/pages/MarketDetails (see its useMarketData), so crawler HTML lists the
// same rows the rendered page does.
export function latestRowsForMarket(rows, grad, pijaca) {
  const marketRows = rows.filter((row) => {
    const parsed = parseMesto(row.Mesto)
    return parsed.grad === grad && parsed.pijaca === pijaca
  })
  let latest = null
  for (const row of marketRows) {
    const time = getRowTime(row)
    if (time !== null && (latest === null || time > latest)) latest = time
  }
  return latest === null ? [] : marketRows.filter((row) => getRowTime(row) === latest)
}

export function renderHome({ lang, drops, cityLinks, lastUpdated }) {
  return page({
    lang,
    heading: tr(lang, 'hero.headline'),
    intro: tr(lang, 'hero.subtitle'),
    sections: [
      lastUpdated ? { html: `<p class="snap-updated">${escapeHtml(lastUpdated)}</p>` } : null,
      drops.length > 0 ? { title: tr(lang, 'weeklyTrends.title'), html: cardList(drops) } : null,
      cityLinks.length > 0 ? { title: tr(lang, 'nav.markets'), html: linkList(cityLinks) } : null,
    ],
  })
}

export function renderCity({ lang, city, marketLinks }) {
  return page({ lang, heading: city, sections: [{ title: tr(lang, 'nav.markets'), html: linkList(marketLinks) }] })
}

export function renderMarket({ lang, market, city, cards }) {
  return page({ lang, heading: market, intro: city, sections: [{ html: cardList(cards) }] })
}

export function renderCategory({ lang, category, market, city, cards }) {
  return page({ lang, heading: `${category} - ${market}`, intro: city, sections: [{ html: cardList(cards) }] })
}

export function renderProduct({ lang, product, current, cards }) {
  return page({
    lang,
    heading: product,
    sections: [{ html: cardList([current, ...cards].filter(Boolean)) }],
  })
}
