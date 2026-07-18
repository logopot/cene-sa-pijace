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
import { translateDataValue, getCanonicalProductSlug, getCanonicalMarketSlug } from './lib/productLabels.mjs'
import { fetchAllMarketRows, readLocalEnvFile, ROOT } from './lib/googleSheets.mjs'
import { loadGoogleFontWeight } from './lib/googleFont.mjs'

readLocalEnvFile()

const WIDTH = 1200
const HEIGHT = 630
const PRODUCTS_DIR = path.join(ROOT, 'public/og/products')
const MARKETS_DIR = path.join(ROOT, 'public/og/markets')
const FALLBACK_PATH = path.join(ROOT, 'public/og-fallback.png')

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

function buildTemplate({ eyebrow, title, subtitle }) {
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
                eyebrow,
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
  const markets = new Map()
  const products = new Map()

  for (const row of rows) {
    const { grad, pijaca } = parseMesto(row.Mesto)
    if (!grad || !pijaca) continue

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

  return { markets: [...markets.values()], products: [...products.values()] }
}

async function main() {
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
      eyebrow: 'Pijačni barometar',
      title: 'Cene sa pijace',
      subtitle: 'Nezavisni pijačni barometar u Srbiji',
    }),
    fonts,
  )
  writeFileSync(FALLBACK_PATH, fallbackPng)
  console.log('[generate-og-images] wrote og-fallback.png')

  let markets
  let products
  try {
    const rows = await fetchAllMarketRows()
    ;({ markets, products } = collectItems(rows))
  } catch (error) {
    console.warn('[generate-og-images] could not fetch sheet data, only the fallback image was generated:', error.message)
    return
  }

  for (const market of markets) {
    const png = await renderPng(
      buildTemplate({
        eyebrow: 'Pijaca',
        title: market.market,
        subtitle: `Pregled pijačnih cena • ${market.city}`,
      }),
      fonts,
    )
    writeFileSync(path.join(MARKETS_DIR, `${market.slug}.png`), png)
  }
  console.log(`[generate-og-images] wrote ${markets.length} market images`)

  for (const product of products) {
    const png = await renderPng(
      buildTemplate({
        eyebrow: 'Trenutna cena',
        title: product.name,
        subtitle: 'Trenutne cene na pijacama u Srbiji',
      }),
      fonts,
    )
    writeFileSync(path.join(PRODUCTS_DIR, `${product.slug}.png`), png)
  }
  console.log(`[generate-og-images] wrote ${products.length} product images`)
}

main()
