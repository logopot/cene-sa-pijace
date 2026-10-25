// Post-build step (package.json "postbuild"): prerenders the homepage from the
// real React components into two files that functions/_middleware.js injects
// into the shell - so the first paint is the real page (header, hero, filter
// bar, price-drop cards, market tiles) with its real styles:
//   dist/snap/index.root.html  the Serbian page, injected INTO #root; the app
//                              hydrates it (React takes over those exact nodes)
//   dist/snap/index.html       the CSS that markup needs, injected into #snapshot
//   dist/snap/index.en.html    the English page; only visitors who saved English
//                              download it (inline script in index.html), shown
//                              instead of the Serbian root until the app swaps
//                              it out (see src/main.jsx)
//
// Pipeline: bundle src/prerender.jsx for Node with Vite (SSR build) -> render
// sr + en with styled-components' ServerStyleSheet -> keep only the bootstrap /
// global CSS rules that markup actually uses (beasties) -> write the files.
// index.html picks which language to show from the saved choice (see its
// inline data-lng script and #snapshot rules).
//
// Pijace i proizvodi keep the lightweight text snapshots from
// scripts/generate-data.mjs. If anything here fails, the build still succeeds
// and the homepage falls back to that text snapshot.
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import Beasties from 'beasties'
import { ROOT } from './lib/googleSheets.mjs'

const DIST = path.join(ROOT, 'dist')
const SSR_OUT = path.join(ROOT, 'dist-ssr')
const LANGUAGES = ['sr', 'en']

async function main() {
  const latest = JSON.parse(readFileSync(path.join(DIST, 'data/latest.json'), 'utf-8'))

  await build({
    root: ROOT,
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    ssr: { noExternal: true },
    build: {
      ssr: path.join(ROOT, 'src/prerender.jsx'),
      outDir: SSR_OUT,
      emptyOutDir: true,
      copyPublicDir: false,
    },
  })

  const entry = readdirEntry()
  const { renderHomepages } = await import(pathToFileURL(entry).href)
  const { pages: rendered, styleTags } = renderHomepages({ latest, languages: LANGUAGES })

  // react-helmet-async emits <title>/<meta>/<link rel=canonical> right at the
  // start of the markup. On the client React hoists those into <head>, so
  // leaving them in #root would make the first hydration render disagree with
  // the HTML. The edge middleware already writes the real head tags, so they
  // are simply dropped here.
  const HOISTED_HEAD_TAGS = /^(?:<title>[\s\S]*?<\/title>|<meta [^>]*>|<link [^>]*>)+/
  const pages = Object.fromEntries(Object.entries(rendered).map(([lang, html]) => [lang, html.replace(HOISTED_HEAD_TAGS, '')]))

  const cssHref = readFileSync(path.join(DIST, 'index.html'), 'utf-8').match(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"/)?.[1]
  if (!cssHref) throw new Error('could not find the app stylesheet in dist/index.html')

  const englishCopy = `<div class="snap-lang" lang="en">${pages.en}</div>`
  const markup = pages.sr + englishCopy

  const beasties = new Beasties({ path: DIST, publicPath: '/', preload: false, pruneSource: false, logLevel: 'silent' })
  const processed = await beasties.process(
    `<!doctype html><html><head><link rel="stylesheet" href="${cssHref}"></head><body>${markup}</body></html>`,
  )
  const criticalCss = processed.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''

  // styled-components' client absorbs (and deletes) any <style data-styled> it
  // finds at startup, then only re-adds rules as components render - which for
  // hydration happens a moment later, so the page would briefly lose those
  // styles and shift. Without the attributes the client leaves these tags alone;
  // the app removes them itself once its own styles are in place.
  const inertStyleTags = styleTags.replace(/ data-styled(?:-version)?="[^"]*"/g, '').replace(/ data-styled(?= |>)/g, '')
  const helpers = `<style>${criticalCss}</style>${inertStyleTags}`
  writeFileSync(path.join(DIST, 'snap/index.html'), helpers)
  writeFileSync(path.join(DIST, 'snap/index.en.html'), englishCopy)
  writeFileSync(path.join(DIST, 'snap/index.root.html'), pages.sr)

  console.log(
    `[prerender-home] wrote dist/snap/index.root.html (${(pages.sr.length / 1024).toFixed(0)} KB) + index.html helpers (${(helpers.length / 1024).toFixed(0)} KB: bootstrap critical CSS ${(criticalCss.length / 1024).toFixed(0)} KB, component CSS ${(styleTags.length / 1024).toFixed(0)} KB, English copy, loaded on demand: ${(pages.en.length / 1024).toFixed(0)} KB)`,
  )
}

function readdirEntry() {
  const file = path.join(SSR_OUT, 'prerender.js')
  const mjs = path.join(SSR_OUT, 'prerender.mjs')
  try {
    readFileSync(file)
    return file
  } catch {
    return mjs
  }
}

main()
  .catch((error) => {
    console.warn('[prerender-home] skipped, homepage keeps its text snapshot:', error.message)
  })
  .finally(() => rmSync(SSR_OUT, { recursive: true, force: true }))
