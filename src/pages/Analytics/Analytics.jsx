import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { LuArrowLeft } from 'react-icons/lu'
import { getCategoryIcon, getCategoryUrlSlug, resolveCategoryBySlug } from '../../utils/categoryIcons.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { resolveGradBySlug, resolvePijacaBySlug, buildCityRoute, buildMarketCategoryRoute } from '../../utils/market.js'
import { useProductAnalytics } from '../../hooks/useProductAnalytics.js'
import PriceHistoryChart from '../../components/PriceHistoryChart/PriceHistoryChart.jsx'
import CityComparisonChart from '../../components/CityComparisonChart/CityComparisonChart.jsx'
import SEO from '../../components/SEO/SEO.jsx'
import { SITE_URL, getProductOgImage } from '../../constants/seo.js'
import NotFound from '../NotFound/NotFound.jsx'
import {
  BackButton,
  PageHeader,
  IconWrap,
  ProductTitle,
  MarketSubtitle,
  Section,
  SectionTitle,
} from './Analytics.styled.js'

function Analytics({ rows }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug, categorySlug, productSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const productFilters = location.state?.productFilters

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolvePijacaBySlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const categoryName = useMemo(() => resolveCategoryBySlug(categorySlug), [categorySlug])
  const market = grad && pijaca ? { grad, pijaca } : null

  const analytics = useProductAnalytics(rows, productSlug, productFilters, grad, categoryName)
  const { identity } = analytics

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

  const handleBack = () => {
    if (grad && pijaca && categoryName) {
      navigate(buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(categoryName, i18n.language), i18n.language))
    } else if (grad) {
      navigate(buildCityRoute(grad, i18n.language))
    } else {
      navigate('/')
    }
  }

  return (
    <Container>
      <SEO
        title={t('seo.product.title', { product: productName })}
        description={t('seo.product.description', { product: productName })}
        url={`${SITE_URL}${location.pathname}`}
        image={getProductOgImage(identity.proizvod)}
        jsonLd={jsonLd}
      />

      <BackButton type="button" onClick={handleBack}>
        <LuArrowLeft />
        {t('analytics.backToMarket')}
      </BackButton>

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
  )
}

export default Analytics
