const CYRILLIC_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z',
  и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'č', џ: 'dž', ш: 'š',
}

// Best-effort fallback for any Cyrillic text not covered by the verified
// maps below (e.g. bgpijace.rs adds a new market/product) - capitalizes
// each word since these are always proper nouns or product names.
export function transliterate(cyrillicText) {
  return cyrillicText
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const latin = word.replace(/[Ѐ-ӿ]/g, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
      return latin.charAt(0).toUpperCase() + latin.slice(1)
    })
    .join(' ')
}

// Verified against bgpijace.rs's live barometar table (2026-07) - an
// explicit map is preferred over automatic transliteration here because
// these are proper nouns where exact casing/diacritics matter: "Kalenić"
// and "Skadarlija" must match the spellings already used in marketInfo.json.
const MARKET_NAMES = {
  'Баново брдо': 'Banovo brdo',
  'Блок 44': 'Blok 44',
  Бањица: 'Banjica',
  Видиковац: 'Vidikovac',
  Душановац: 'Dušanovac',
  Звездара: 'Zvezdara',
  'Зелени венац': 'Zeleni venac',
  Земун: 'Zemun',
  Каленић: 'Kalenić',
  Миријево: 'Mirijevo',
  Палилула: 'Palilula',
  Скадарлија: 'Skadarlija',
  'Смедеревски ђерам': 'Smederevski đeram',
  'ТЦ Нови Београд': 'TC Novi Beograd',
}

// category names match src/constants/categories.js's Serbian category
// names exactly, so JKP rows slot into the app's existing category filter.
const PRODUCTS = {
  КРОМПИР: { name: 'Krompir', category: 'Povrće' },
  ПАСУЉ: { name: 'Pasulj', category: 'Povrće' },
  КУПУС: { name: 'Kupus', category: 'Povrće' },
  КАРФИОЛ: { name: 'Karfiol', category: 'Povrće' },
  ТИКВИЦЕ: { name: 'Tikvice', category: 'Povrće' },
  // Named noun-first (matching STIPS's own "Luk crni"/"Luk beli" - see
  // src/utils/productId.js's normalizeProductName in the main app), with
  // the variety qualifier moved to a trailing "(mladi)" so it strips down
  // to the same base family as STIPS's own "Luk crni (mladi)"/"Luk beli
  // (mladi)" rows instead of forming its own disconnected "Mladi crni
  // luk"/"Mladi beli luk" family.
  'МЛАДИ ЦРНИ ЛУК': { name: 'Luk crni (mladi)', category: 'Povrće' },
  'МЛАДИ БЕЛИ ЛУК': { name: 'Luk beli (mladi)', category: 'Povrće' },
  ПАРАДАЈЗ: { name: 'Paradajz', category: 'Povrće' },
  КРАСТАВАЦ: { name: 'Krastavac', category: 'Povrće' },
  ПАПРИКА: { name: 'Paprika', category: 'Povrće' },
  'ЗЕЛЕНА САЛАТА': { name: 'Zelena salata', category: 'Povrće' },
  // STIPS has no "mladi"/"sve sorte" qualifier-free bare name for these two
  // either, but its own qualified variants ("Luk crni (mladi)", "Luk crni
  // (sve sorte)") share the same "Luk crni" base once normalized - this
  // bare name normalizes to that identical base with nothing to strip.
  'ЦРНИ ЛУК': { name: 'Luk crni', category: 'Povrće' },
  // STIPS's family for this vegetable is the generic "Patlidžan (sve
  // sorte)" (base "Patlidžan") - dropping "Plavi" (the specific purple
  // variety JKP's own header names) aligns with that same family instead of
  // forming its own disconnected "Plavi Patlidžan" one.
  'ПЛАВИ ПАТЛИЏАН': { name: 'Patlidžan', category: 'Povrće' },
  КАЈСИЈА: { name: 'Kajsija', category: 'Voće' },
  МАЛИНА: { name: 'Malina', category: 'Voće' },
  ДИЊА: { name: 'Dinja', category: 'Voće' },
  ЛУБЕНИЦА: { name: 'Lubenica', category: 'Voće' },
}

export function resolveMarketName(cyrillicName) {
  return MARKET_NAMES[cyrillicName] ?? transliterate(cyrillicName)
}

export function resolveProduct(cyrillicName) {
  return PRODUCTS[cyrillicName] ?? { name: transliterate(cyrillicName), category: 'Povrće' }
}
