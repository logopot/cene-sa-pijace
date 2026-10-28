import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SITE_URL, DEFAULT_OG_IMAGE } from '../../constants/seo.js'

// og:locale wants underscore-separated IETF tags (sr_RS, en_US), not the
// bare i18next language codes this app routes on.
const OG_LOCALE = {
  sr: 'sr_RS',
  en: 'en_US',
}

// The edge middleware writes the product's Product JSON-LD into the HTML it
// serves (id below, see functions/_middleware.js), so it is visible without
// JavaScript. While the page being shown is the one that markup describes, the
// app must not add a second copy; once it shows anything else (client-side
// navigation, or fresher data than the build), the server's copy is stale and
// is dropped.
const PRERENDERED_JSON_LD_ID = 'ld-product'

function getPrerenderedJsonLd() {
  if (typeof document === 'undefined') return null
  return document.getElementById(PRERENDERED_JSON_LD_ID)
}

function isPrerenderedJsonLd(jsonLd) {
  const element = getPrerenderedJsonLd()
  if (!element || !jsonLd) return false
  try {
    return JSON.stringify(JSON.parse(element.textContent)) === JSON.stringify(jsonLd)
  } catch {
    return false
  }
}

// Central <head> manager - every route renders one of these with its own
// title/description/image/url so search engines and chat-app link unfurlers
// (Viber/WhatsApp/Facebook all read Open Graph, not just <title>) get a
// distinct, accurate preview per page instead of the static index.html tags.
function SEO({ title, description, image = DEFAULT_OG_IMAGE, url = SITE_URL, jsonLd }) {
  const { i18n } = useTranslation()
  const alreadyInHtml = isPrerenderedJsonLd(jsonLd)

  useEffect(() => {
    if (!alreadyInHtml) getPrerenderedJsonLd()?.remove()
  }, [alreadyInHtml])

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={OG_LOCALE[i18n.language] ?? OG_LOCALE.sr} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <link rel="canonical" href={url} />

      {jsonLd && !alreadyInHtml && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}

export default SEO
