import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { getCategoryIcon, getCategorySlug, getCategoryUrlSlug, resolveCategoryBySlug } from '../../utils/categoryIcons.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { resolveGradBySlug, resolvePijacaBySlug, buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../../utils/market.js'
import { useProductAnalytics } from '../../hooks/useProductAnalytics.js'
import PriceHistoryChart from '../../components/PriceHistoryChart/PriceHistoryChart.jsx'
import CityComparisonChart from '../../components/CityComparisonChart/CityComparisonChart.jsx'
import SEO from '../../components/SEO/SEO.jsx'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx'
import GlobalFilterBar from '../../components/FilterBar/GlobalFilterBar.jsx'
import { SITE_URL, getProductOgImage } from '../../constants/seo.js'
import NotFound from '../NotFound/NotFound.jsx'
import {
  StatusSection,
  PageHeader,
  IconWrap,
  ProductTitle,
  MarketSubtitle,
  Section,
  SectionTitle,
} from './Analytics.styled.js'

function Analytics({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug, categorySlug, productSlug } = useParams()
  const location = useLocation()

  const productFilters = location.state?.productFilters

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolvePijacaBySlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const categoryName = useMemo(() => resolveCategoryBySlug(categorySlug), [categorySlug])
  const market = grad && pijaca ? { grad, pijaca } : null

  const analytics = useProductAnalytics(rows, productSlug, productFilters, grad, categoryName)
  const { identity } = analytics

  // Deep-linked/shared URLs land here before the app shell's own fetch has a
  // chance to run again - without these two gates, a data-fetch failure or a
  // still-loading rows array would fall straight into the not-found branch
  // below and misreport a real outage as "this page doesn't exist".
  if (loading) {
    return (
      <StatusSection>
        <Spinner animation="border" role="status" aria-label={t('results.loading')} />
      </StatusSection>
    )
  }

  if (error) {
    return (
      <StatusSection>
        <Container>
          <Alert variant="danger">{t('results.error')}</Alert>
        </Container>
      </StatusSection>
    )
  }

  if (!grad || !pijaca || !categoryName || !identity.proizvod) {
    return <NotFound />
  }

  const Icon = getCategoryIcon(identity.kategorija)
  const productName = translateDataValue(t, 'proizvod', identity.proizvod)
  const gradLabel = market ? translateDataValue(t, 'grad', market.grad) : null
  const pijacaLabel = market ? translateDataValue(t, 'pijaca', market.pijaca) : null

  // Google's Product rich-result schema wants a single offers block, not a
  // per-city breakdown - cheapest/priciest (see useProductAnalytics) already
  // give the low/high bound across cities for the product's latest week, so
  // they map directly to AggregateOffer without recomputing anything.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    category: identity.kategorija,
    ...(analytics.cheapest &&
      analytics.priciest && {
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'RSD',
          lowPrice: analytics.cheapest.price,
          highPrice: analytics.priciest.price,
          offerCount: analytics.cityComparison.length,
        },
      }),
  }

  const categoryLabel = t(`categories.${getCategorySlug(categoryName)}`)
  const breadcrumbItems = [
    { label: t('breadcrumbs.home'), to: '/' },
    { label: gradLabel, to: buildCityRoute(grad, i18n.language) },
    { label: pijacaLabel, to: buildMarketRoute(grad, pijaca, i18n.language) },
    {
      label: categoryLabel,
      to: buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(categoryName, i18n.language), i18n.language),
    },
    { label: productName },
  ]

  return (
    <>
      <GlobalFilterBar />

      <Container>
        <SEO
          title={t('seo.product.title', { product: productName })}
          description={t('seo.product.description', { product: productName })}
          url={`${SITE_URL}${location.pathname}`}
          image={getProductOgImage(identity.proizvod)}
          jsonLd={jsonLd}
        />

        <Breadcrumbs items={breadcrumbItems} />

        <PageHeader>
          <IconWrap>
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable module-level reference, not created during render */}
            <Icon />
          </IconWrap>
          <div>
            <ProductTitle>{productName}</ProductTitle>
            {market && (
              <MarketSubtitle>
                {pijacaLabel}, {gradLabel}
              </MarketSubtitle>
            )}
          </div>
        </PageHeader>

        <Section>
          <SectionTitle>{t('analytics.historyTitle')}</SectionTitle>
          <PriceHistoryChart data={analytics.history} />
        </Section>

        <Section>
          <SectionTitle>{t('analytics.comparisonTitle')}</SectionTitle>
          <CityComparisonChart
            data={analytics.cityComparison}
            cheapest={analytics.cheapest}
            priciest={analytics.priciest}
            highlightGrad={market?.grad}
          />
        </Section>
      </Container>
    </>
  )
}

export default Analytics
