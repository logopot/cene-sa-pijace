import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { Alert, Container } from 'react-bootstrap'
import PageSkeleton from '../../components/PageSkeleton/PageSkeleton.jsx'
import { getCategoryIcon, getCategorySlug, getCategoryUrlSlug, resolveCategoryBySlug } from '../../utils/categoryIcons.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { resolveGradBySlug, resolvePijacaBySlug, buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../../utils/market.js'
import { trackPageEvent } from '../../utils/analytics.js'
import { formatPriceValue } from '../../utils/price.js'
import { useProductAnalytics } from '../../hooks/useProductAnalytics.js'
import { useProductHistory } from '../../hooks/useProductHistory.js'
import { productMatchesSlug, normalizeProductName, slugify } from '../../utils/productId.js'
import PriceHistoryChart from '../../components/PriceHistoryChart/PriceHistoryChart.jsx'
import VariationSelector from '../../components/VariationSelector/VariationSelector.jsx'
import MarketComparisonChart from '../../components/MarketComparisonChart/MarketComparisonChart.jsx'
import CityComparisonChart from '../../components/CityComparisonChart/CityComparisonChart.jsx'
import SEO from '../../components/SEO/SEO.jsx'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx'
import GlobalFilterBar from '../../components/FilterBar/GlobalFilterBar.jsx'
import { SITE_URL, getProductOgImage } from '../../constants/seo.js'
import NotFound from '../NotFound/NotFound.jsx'
import {
  StatusSection,
  ChartSkeleton,
  PageHeader,
  TitleGroup,
  IconWrap,
  ProductTitle,
  MarketSubtitle,
  PriceBlock,
  PriceValue,
  SourceLabel,
  Section,
  SectionTitle,
} from './Analytics.styled.js'

function Analytics({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug, categorySlug, productSlug } = useParams()
  const location = useLocation()

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolvePijacaBySlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const categoryName = useMemo(() => resolveCategoryBySlug(categorySlug), [categorySlug])
  const market = grad && pijaca ? { grad, pijaca } : null
  // Resets to 'all' automatically on every navigation - Analytics remounts
  // per route (see App.jsx's key={location.key}), so a fresh product page
  // never inherits the previous product's selected variation.
  const [selectedVariation, setSelectedVariation] = useState('all')

  // The latest-only rows the app boots with are enough for the header and the
  // comparison widgets, but the price-history chart needs every past
  // datapoint of the product *family* (see useProductAnalytics's itemRows):
  // that file is fetched lazily here, keyed off the family of the product the
  // URL points at. Once it arrives it simply replaces the rows the analytics
  // hook works from - it is a superset of everything the hook reads.
  const familySlug = useMemo(() => {
    const match = rows.find(
      (row) => productMatchesSlug(row.Proizvod, productSlug) && (!categoryName || row.Kategorija === categoryName),
    )
    return match ? slugify(normalizeProductName(match.Proizvod)) : ''
  }, [rows, productSlug, categoryName])
  const productHistory = useProductHistory(familySlug)

  const analytics = useProductAnalytics(productHistory.rows ?? rows, productSlug, grad, categoryName, pijaca, selectedVariation)
  const { identity } = analytics
  const hasHistory = analytics.history.length > 0

  useEffect(() => {
    if (!identity.proizvod || !pijaca) return
    trackPageEvent('view_product', {
      product_name: identity.proizvod,
      category: identity.kategorija,
      market_name: pijaca,
    })
  }, [identity.proizvod, identity.kategorija, pijaca])

  // The history chart is on screen once its lazy data has arrived and there's
  // something to plot.
  const historyVisible = !productHistory.loading && hasHistory
  useEffect(() => {
    if (historyVisible) trackPageEvent('view_price_history', { product_name: identity.proizvod })
  }, [historyVisible, identity.proizvod])

  // Deep-linked/shared URLs land here before the app shell's own fetch has a
  // chance to run again - without these two gates, a data-fetch failure or a
  // still-loading rows array would fall straight into the not-found branch
  // below and misreport a real outage as "this page doesn't exist".
  if (loading) {
    return (
      <PageSkeleton />
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
  const jedMereLabel =
    analytics.currentMarket?.unit ? translateDataValue(t, 'jedMere', analytics.currentMarket.unit) : ''

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
          <TitleGroup>
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
          </TitleGroup>

          {analytics.currentMarket && (
            <PriceBlock>
              <PriceValue>
                {formatPriceValue(analytics.currentMarket.price)}{' '}
                {jedMereLabel ? t('productCard.priceUnit', { unit: jedMereLabel }) : t('productCard.priceNoUnit')}
              </PriceValue>
              <SourceLabel>
                {t('analytics.priceSourceLabel', {
                  source: t('productCard.source', { source: analytics.currentMarket.sourceLabel }),
                })}
              </SourceLabel>
            </PriceBlock>
          )}
        </PageHeader>

        <Section>
          <SectionTitle>{t('analytics.historyTitle')}</SectionTitle>
          <VariationSelector
            variations={analytics.availableVariations}
            selected={selectedVariation}
            onSelect={setSelectedVariation}
          />
          {productHistory.loading ? (
            <ChartSkeleton role="status" aria-busy="true" aria-label={t('results.loading')} />
          ) : (
            <PriceHistoryChart
              data={analytics.history}
              sources={analytics.historySources}
              missingSources={analytics.missingHistorySources}
            />
          )}
        </Section>

        <Section>
          <SectionTitle>{t('analytics.marketComparisonTitle', { city: gradLabel })}</SectionTitle>
          <MarketComparisonChart data={analytics.marketComparison} highlightPijaca={market?.pijaca} />
        </Section>

        <Section>
          <SectionTitle>{t('analytics.comparisonTitle')}</SectionTitle>
          <CityComparisonChart data={analytics.cityComparison} highlightGrad={market?.grad} />
        </Section>
      </Container>
    </>
  )
}

export default Analytics
