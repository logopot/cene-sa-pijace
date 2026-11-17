// Title / meta description copy for the pages whose SEO text is built from the
// page's own facts (Kvantaška pijaca market + category pages in Serbian, every
// product page in both languages). Pure string builders with NO imports, so the
// same code runs in three places and the copy can never drift between them:
//   - scripts/generate-seo-map.mjs  (build: measures uniqueness, resolves duplicates)
//   - functions/_middleware.js      (edge: the <title>/<meta> crawlers get in the first HTML)
//   - the React pages               (client: the <title>/<meta> Helmet sets after hydration)
// Nothing here invents data: every number, source and date is passed in from
// the page's own rows.

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

// Raw (Serbian) name of the market whose pages get the "Kvantaš" wording.
export const KVANTASKA_MARKET = 'Kvantaška pijaca'

// Only the Serbian pages of that market - in English the same market is
// "Wholesale Market" and gets no slang.
export function isKvantaskaMarket(lang, marketName) {
  return lang === 'sr' && marketName === KVANTASKA_MARKET
}

function truncate(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:(–-]+$/, '')}…`
}

// Product names carry what tells them apart at both ends ("Kukuruz (okrunjen,
// prirodno sušen)" / "Kukuruz (okrunjen, veštački sušen)"), so a name that has
// to be cut loses its middle.
function truncateMiddle(text, max) {
  if (text.length <= max) return text
  const keep = max - 1
  const head = Math.ceil(keep / 2)
  return `${text.slice(0, head).trimEnd()}…${text.slice(text.length - (keep - head)).trimStart()}`
}

// First candidate that fits; if none does, the shortest one, cut at a word.
function fit(candidates, max) {
  const unique = candidates.filter((candidate, index) => candidates.indexOf(candidate) === index)
  return unique.find((candidate) => candidate.length <= max) ?? truncate(unique[unique.length - 1], max)
}

// Title builders in the order of shortening: build(name, market) -> title. When
// even the last one is over the limit, the market's name is cut (with an
// ellipsis, down to MIN_MARKET characters), then the product's name from the
// middle; the city is never touched.
const MIN_MARKET = 12
const MIN_NAME = 14

function fitTitle(max, name, builders) {
  for (const { market, build } of builders) {
    const title = build(name, market)
    if (title.length <= max) return title
  }
  const { market, build } = builders[builders.length - 1]
  const overBy = build(name, market).length - max
  const cutMarket = market.length > MIN_MARKET ? truncate(market, Math.max(MIN_MARKET, market.length - overBy)) : market
  const room = max - build('', cutMarket).length
  const title = build(name, cutMarket)
  return title.length <= max ? title : build(truncateMiddle(name, Math.max(MIN_NAME, room)), cutMarket)
}

const hasPijaca = (name) => /pijac/i.test(name)

// "skrati naziv pijace": drop the generic word ("Kvantaška pijaca" -> "Kvantaška",
// "Wholesale Market" -> "Wholesale"); a name that is only the generic word stays.
function shortMarketName(lang, market) {
  const stripped = (lang === 'en' ? market.replace(/\s*\bmarket\b\s*/i, ' ') : market.replace(/\s*\bpijaca\b\s*/i, ' ')).trim()
  return stripped || market
}

// Lowercase, no diacritics, words separated by single spaces: "Niš" -> "nis",
// "Đurđevo" -> "djurdjevo", "TC Novi Beograd" -> "tc novi beograd".
function plain(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'dj')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// True when the city already stands in the market's name as whole words, however
// it is cased or accented ("TC Novi Beograd" holds "Beograd", so nothing is
// added; "Zelena pijaca" does not hold "Niš"). Everything that puts a market and
// its city side by side uses this, so no page reads "TC Novi Beograd Beograd".
export function cityInMarketName(market, city) {
  const name = plain(market ?? '')
  const place = plain(city ?? '')
  return place !== '' && ` ${name} `.includes(` ${place} `)
}

// "{market} {city}" - or just the market when the city is already in its name.
export function placeLabel(market, city) {
  return cityInMarketName(market, city) ? market : `${market} ${city}`
}

// "{market}, {city}" with the same rule (headings, subtitles, snapshot cards).
export function placeWithComma(market, city) {
  return cityInMarketName(market, city) ? market : `${market}, ${city}`
}

// Market and category pages of a market whose name holds its city: the same
// copy as the templates in the locale files, without the city.
export function marketCopyWithoutCity({ lang, market, generic }) {
  if (lang === 'en') {
    return generic
      ? { title: `${market} - Current Price Overview`, description: `Fresh product prices at ${market}. Check the offer before you go shopping.` }
      : { title: `${market} Market - Current Price Overview`, description: `Fresh product prices at ${market} market. Check the offer before you go shopping.` }
  }
  return generic
    ? { title: `${market} - Pregled aktuelnih cena`, description: `Sveže cene proizvoda: ${market}. Proverite ponudu pre odlaska u kupovinu.` }
    : { title: `Pijaca ${market} - Pregled aktuelnih cena`, description: `Sveže cene proizvoda na pijaci ${market}. Proverite ponudu pre odlaska u kupovinu.` }
}

export function categoryCopyWithoutCity({ lang, category, market, generic }) {
  const description = `${market} • ${category}`
  if (lang === 'en') return { title: `${category} Prices at ${market}${generic ? '' : ' Market'}`, description }
  return { title: generic ? `${category} - Cene: ${market}` : `${category} - Cene na pijaci ${market}`, description }
}

// Dates come as "12.11.2026." / "09.11. – 15.11.2026." - already ending in a dot.
const closed = (text) => (text.endsWith('.') ? text : `${text}.`)

const formatPrice = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

// ---------------------------------------------------------------- Kvantaška

function kvantaskaSourceTail(source, date, dateWord) {
  if (source && date) return closed(` Izvor: ${source}, ${dateWord} ${date}`)
  if (source) return closed(` Izvor: ${source}`)
  return ''
}

// /grad/{grad}/kvantaska-pijaca
export function kvantaskaMarketCopy({ city, source, date }) {
  const head = `Kvantaška pijaca ${city}`
  const title = fit(
    [`${head} (Kvantaš) – cene povrća i voća`, `${head} (Kvantaš) – cene`, `${head} – cene`],
    TITLE_MAX,
  )
  const lead = `${head}: aktuelne cene povrća, voća i drugih namirnica`
  const description = fit(
    [
      `${lead} (Kvantaš cene po proizvodima).${kvantaskaSourceTail(source, date, 'datum merenja')}`,
      `${lead} (Kvantaš cene po proizvodima).${kvantaskaSourceTail(source, date, 'datum')}`,
      `${lead} (Kvantaš).${kvantaskaSourceTail(source, date, 'datum')}`,
      `${lead} (Kvantaš).${kvantaskaSourceTail(source, '', '')}`,
    ],
    DESCRIPTION_MAX,
  )
  return { title, description }
}

// /grad/{grad}/kvantaska-pijaca/{kategorija}
export function kvantaskaCategoryCopy({ category, city, source, date }) {
  const title = fit(
    [
      `${category} cene – Kvantaška pijaca ${city}`,
      `${category} cene – Kvantaška ${city}`,
    ],
    TITLE_MAX,
  )
  const lead = `${category} cene na Kvantaškoj pijaci ${city}`
  const description = fit(
    [
      `${lead} (Kvantaš): aktuelne cene po proizvodima.${kvantaskaSourceTail(source, date, 'datum merenja')}`,
      `${lead} (Kvantaš): aktuelne cene po proizvodima.${kvantaskaSourceTail(source, date, 'datum')}`,
      `${lead} (Kvantaš).${kvantaskaSourceTail(source, date, 'datum')}`,
      `${lead} (Kvantaš).${kvantaskaSourceTail(source, '', '')}`,
    ],
    DESCRIPTION_MAX,
  )
  return { title, description }
}

// ------------------------------------------------------------------ Product

// facts: { name, market, city, min, max, unit, source, date, variant }
// min/max are the product's own latest row at this market (null when that
// market has no priced row - the page is then noindex, see generate-seo-map).
// variant is only set to tell apart pages whose copy would otherwise be
// identical (same name under two categories, two names with one translation).
export function productCopy(lang, facts) {
  return lang === 'en' ? productCopyEn(facts) : productCopySr(facts)
}

function productCopySr({ name, market, city, min, max, unit, source, date, variant, stale, lastDate }) {
  const kvantas = isKvantaskaMarket('sr', market)
  const inName = cityInMarketName(market, city)
  const tag = variant ? ` (${variant})` : ''
  const titleFor = (marketName, withKvantas) => ({
    market: marketName,
    build: (text, shown) => `${text} cena – ${inName ? shown : `${shown} ${city}`}${withKvantas ? ' (Kvantaš)' : ''}${tag}`,
  })

  // Order of shortening: "(Kvantaš)", then the market's name, the city stays.
  const title = fitTitle(TITLE_MAX, name, [
    ...(kvantas ? [titleFor(market, true)] : []),
    titleFor(market, false),
    titleFor(shortMarketName('sr', market), false),
  ])

  if (stale && min !== null && min !== undefined) {
    // Nothing recent to quote: no "aktuelna cena" - the page says so and gives the
    // last recorded price with its date.
    const range = min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`
    const place = placeLabel(market, city)
    const label = `${name}${tag}, ${place}`
    const withUnit = `${label}: Nema aktuelnih podataka. Poslednja zabeležena cena: ${range} RSD${unit ? `/${unit}` : ''} (${lastDate}).`
    const noUnit = `${label}: Nema aktuelnih podataka. Poslednja cena: ${range} RSD (${lastDate}).`
    return { title, description: fit([withUnit, noUnit], DESCRIPTION_MAX) }
  }

  const generic = hasPijaca(market)
  const where = generic ? `, ${placeLabel(market, city)}` : ` na pijaci ${placeLabel(market, city)}`
  const label = `${name}${tag}`
  const unitPart = unit ? ` (${unit})` : ''
  const tail = (withDate) => (source ? closed(` Izvor: ${source}${withDate && date ? `, ${date}` : ''}`) : '')
  let body
  if (min === null || min === undefined) {
    body = `${label}: trenutno nema aktuelne cene${where}.`
  } else {
    const range = min === max ? `aktuelna cena ${formatPrice(min)} RSD` : `aktuelna cena od ${formatPrice(min)} do ${formatPrice(max)} RSD`
    body = `${label}: ${range}${unitPart}${where}.`
  }
  const description = fit([`${body}${tail(true)}`, `${body}${tail(false)}`, body], DESCRIPTION_MAX)
  return { title, description }
}

function productCopyEn({ name, market, city, min, max, unit, source, date, variant, stale, lastDate }) {
  const inName = cityInMarketName(market, city)
  const place = inName ? variant : variant ? `${city}, ${variant}` : city
  const titleFor = (marketName) => ({
    market: marketName,
    build: (text, shown) => `${text} price – ${shown}${place ? ` (${place})` : ''}`,
  })
  const title = fitTitle(TITLE_MAX, name, [titleFor(market), titleFor(shortMarketName('en', market))])

  if (stale && min !== null && min !== undefined) {
    const range = min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`
    const label = `${variant ? `${name} (${variant})` : name}, ${placeWithComma(market, city)}`
    const withUnit = `${label}: No current data. Last recorded price: ${range} RSD${unit ? ` per ${unit}` : ''} (${lastDate}).`
    const noUnit = `${label}: No current data. Last price: ${range} RSD (${lastDate}).`
    return { title, description: fit([withUnit, noUnit], DESCRIPTION_MAX) }
  }

  const label = variant ? `${name} (${variant})` : name
  const tail = (withDate) => (source ? closed(` Source: ${source}${withDate && date ? `, ${date}` : ''}`) : '')
  const unitPart = unit ? ` per ${unit}` : ''
  let body
  if (min === null || min === undefined) {
    body = `${label}: no current price at ${placeWithComma(market, city)}.`
  } else {
    const range = min === max ? `current price ${formatPrice(min)} RSD` : `current price from ${formatPrice(min)} to ${formatPrice(max)} RSD`
    body = `${label}: ${range}${unitPart} at ${placeWithComma(market, city)}.`
  }
  const description = fit([`${body}${tail(true)}`, `${body}${tail(false)}`, body], DESCRIPTION_MAX)
  return { title, description }
}

// ------------------------------------------------------- manifest entry glue

// The edge function and the build both turn a manifest entry (see
// scripts/generate-seo-map.mjs for the field list) into copy through this one
// function. Returns null for entry kinds that keep their existing templates.
export function manifestEntryCopy(entry) {
  if (entry.type === 'product') {
    const [min, max] = entry.pr ?? [null, null]
    return productCopy(entry.lang, {
      name: entry.name,
      market: entry.mk,
      city: entry.ct,
      min,
      max,
      unit: entry.un,
      source: entry.sr,
      date: entry.dt,
      variant: entry.vr,
      stale: Boolean(entry.st),
      lastDate: entry.lp,
    })
  }
  if (entry.type === 'market' && isKvantaskaMarket(entry.lang, entry.market)) {
    return kvantaskaMarketCopy({ city: entry.city, source: entry.sr, date: entry.dt })
  }
  if (entry.type === 'category' && isKvantaskaMarket(entry.lang, entry.market)) {
    return kvantaskaCategoryCopy({ category: entry.category, city: entry.city, source: entry.sr, date: entry.dt })
  }
  return null
}

