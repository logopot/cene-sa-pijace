// Pre-build step (see package.json's "prebuild" script) that renders a
// dedicated 1200x630 Open Graph image for every product and market, plus one
// sitewide fallback. Runs once at build time via satori (layout -> SVG) +
// @resvg/resvg-js (SVG -> PNG) - nothing here runs per-request.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { theme } from '../src/styles/theme.js'
import { parseMesto } from '../src/utils/market.js'
import {
  translateDataValue,
  getCanonicalProductSlug,
  getCanonicalMarketSlug,
  getCanonicalCitySlug,
} from './lib/productLabels.mjs'
import { fetchAllMarketRows, readLocalEnvFile, ROOT } from './lib/googleSheets.mjs'
import { loadGoogleFontWeight } from './lib/googleFont.mjs'

readLocalEnvFile()

const WIDTH = 1200
const HEIGHT = 630
const CITIES_DIR = path.join(ROOT, 'public/og/cities')
const PRODUCTS_DIR = path.join(ROOT, 'public/og/products')
const MARKETS_DIR = path.join(ROOT, 'public/og/markets')
const FALLBACK_PATH = path.join(ROOT, 'public/og-fallback.png')

// Top-left masthead tag, identical across every image type - see
// buildTemplate below, where city/market/product only vary the big title and
// subtitle, not this brand anchor.
const EYEBROW = 'Nezavisni pijačni portal'

function h(type, props = {}, children = []) {
  return { type, props: { ...props, children } }
}

// Images always render the Serbian display name - see the file header note
// in scripts/generate-seo-map.mjs's SEO_MANIFEST for why the meta *text*
// (title/description) stays per-language while the *image* doesn't: this
// site's images are a brand-first asset, not a translated document, and
// generating a second bilingual image set per item wasn't asked for.
function pickTitleFontSize(text) {
  if (text.length <= 18) return 88
  if (text.length <= 30) return 68
  if (text.length <= 45) return 54
  return 42
}

function buildTemplate({ title, subtitle }) {
  return h(
    'div',
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        backgroundColor: theme.colors.bg,
        fontFamily: 'Plus Jakarta Sans',
      },
    },
    [
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            margin: 40,
            padding: 56,
            border: `1px solid rgba(15, 23, 42, 0.06)`,
          },
        },
        [
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column' } },
            [
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: theme.colors.primaryTintLight,
                    marginBottom: 28,
                  },
                },
                EYEBROW,
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontSize: pickTitleFontSize(title),
                    fontWeight: 800,
                    letterSpacing: -2,
                    lineHeight: 1.08,
                    color: theme.colors.titleDark,
                    maxWidth: 1000,
                  },
                },
                title,
              ),
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    fontSize: 30,
                    fontWeight: 400,
                    color: theme.colors.textSecondary,
                    marginTop: 22,
                    maxWidth: 900,
                  },
                },
                subtitle,
              ),
            ],
          ),
          h(
            'div',
            {
              style: {
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: theme.colors.primaryGreen,
              },
            },
            'CENESAPIJACE.ORG',
          ),
        ],
      ),
    ],
  )
}

async function renderPng(template, fonts) {
  const svg = await satori(template, { width: WIDTH, height: HEIGHT, fonts })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
  return resvg.render().asPng()
}

async function loadFonts() {
  const [regular, bold, extrabold] = await Promise.all([
    loadGoogleFontWeight('Plus Jakarta Sans', 400),
    loadGoogleFontWeight('Plus Jakarta Sans', 700),
    loadGoogleFontWeight('Plus Jakarta Sans', 800),
  ])
  return [
    { name: 'Plus Jakarta Sans', data: regular, weight: 400, style: 'normal' },
    { name: 'Plus Jakarta Sans', data: bold, weight: 700, style: 'normal' },
    { name: 'Plus Jakarta Sans', data: extrabold, weight: 800, style: 'normal' },
  ]
}

function collectItems(rows) {
  const cities = new Map()
  const markets = new Map()
  const products = new Map()

  for (const row of rows) {
    const { grad, pijaca } = parseMesto(row.Mesto)
    if (!grad || !pijaca) continue

    const citySlug = getCanonicalCitySlug(grad)
    if (!cities.has(citySlug)) {
      cities.set(citySlug, { slug: citySlug, city: translateDataValue('sr', 'grad', grad) })
    }

    const marketSlug = getCanonicalMarketSlug(grad, pijaca)
    if (!markets.has(marketSlug)) {
      markets.set(marketSlug, {
        slug: marketSlug,
        market: translateDataValue('sr', 'pijaca', pijaca),
        city: translateDataValue('sr', 'grad', grad),
      })
    }

    if (row.Proizvod) {
      const productSlug = getCanonicalProductSlug(row.Proizvod)
      if (!products.has(productSlug)) {
        products.set(productSlug, {
          slug: productSlug,
          name: translateDataValue('sr', 'proizvod', row.Proizvod),
        })
      }
    }
  }

  return { cities: [...cities.values()], markets: [...markets.values()], products: [...products.values()] }
}

async function main() {
  mkdirSync(CITIES_DIR, { recursive: true })
  mkdirSync(PRODUCTS_DIR, { recursive: true })
  mkdirSync(MARKETS_DIR, { recursive: true })

  let fonts
  try {
    fonts = await loadFonts()
  } catch (error) {
    console.warn('[generate-og-images] could not load Plus Jakarta Sans, skipping image generation entirely:', error.message)
    return
  }

  // The fallback doesn't depend on sheet data, so it's generated
  // unconditionally, before the (network-dependent) row fetch below - the
  // site should always have at least this one image even on a build where
  // Sheets is unreachable.
  const fallbackPng = await renderPng(
    buildTemplate({
      title: 'Cene sa pijace',
      subtitle: 'Pratite aktuelne cene na pijacama širom Srbije',
    }),
    fonts,
  )
  writeFileSync(FALLBACK_PATH, fallbackPng)
  console.log('[generate-og-images] wrote og-fallback.png')

  let cities
  let markets
  let products
  try {
    const rows = await fetchAllMarketRows()
    ;({ cities, markets, products } = collectItems(rows))
  } catch (error) {
    console.warn('[generate-og-images] could not fetch sheet data, only the fallback image was generated:', error.message)
    return
  }

  // City and market images share the same brand-forward title ("Cene sa
  // pijace") - the specific location lives in the subtitle instead (see
  // functions/_middleware.js's matching og:title/description behavior for
  // these two route types). Product images keep the product name as the big
  // title, since that's the one thing worth a distinct headline per image.
  for (const city of cities) {
    const png = await renderPng(
      buildTemplate({
        title: 'Cene sa pijace',
        subtitle: `${city.city} • Aktuelne cene na pijacama`,
      }),
      fonts,
    )
    writeFileSync(path.join(CITIES_DIR, `${city.slug}.png`), png)
  }
  console.log(`[generate-og-images] wrote ${cities.length} city images`)

  for (const market of markets) {
    const png = await renderPng(
      buildTemplate({
        title: 'Cene sa pijace',
        subtitle: `${market.city} • ${market.market}`,
      }),
      fonts,
    )
    writeFileSync(path.join(MARKETS_DIR, `${market.slug}.png`), png)
  }
  console.log(`[generate-og-images] wrote ${markets.length} market images`)

  for (const product of products) {
    const png = await renderPng(
      buildTemplate({
        title: product.name,
        subtitle: 'Aktuelne cene na pijacama u Srbiji',
      }),
      fonts,
    )
    writeFileSync(path.join(PRODUCTS_DIR, `${product.slug}.png`), png)
  }
  console.log(`[generate-og-images] wrote ${products.length} product images`)
}

main()
