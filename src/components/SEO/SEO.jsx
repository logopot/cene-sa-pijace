import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SITE_URL, DEFAULT_OG_IMAGE } from '../../constants/seo.js'

// og:locale wants underscore-separated IETF tags (sr_RS, en_US), not the
// bare i18next language codes this app routes on.
const OG_LOCALE = {
  sr: 'sr_RS',
  en: 'en_US',
}

// Central <head> manager - every route renders one of these with its own
// title/description/image/url so search engines and chat-app link unfurlers
// (Viber/WhatsApp/Facebook all read Open Graph, not just <title>) get a
// distinct, accurate preview per page instead of the static index.html tags.
function SEO({ title, description, image = DEFAULT_OG_IMAGE, url = SITE_URL, jsonLd }) {
  const { i18n } = useTranslation()

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

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}

export default SEO
