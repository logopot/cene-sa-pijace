import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { ALL_MARKETS } from '../../constants/filters.js'
import {
  parseMesto,
  resolveGradBySlug,
  resolveMarketSlug,
  buildCityRoute,
  buildMarketRoute,
  buildMarketCategoryRoute,
} from '../../utils/market.js'
import { getCategoryIcon, getCategorySlug, getCategoryUrlSlug, resolveCategoryBySlug } from '../../utils/categoryIcons.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { lowercaseFirst } from '../../utils/formatText.js'
import { getRowTime, getRowRangeLabel, getLatestWeekTime } from '../../utils/week.js'
import WeekStatus from '../../components/WeekStatus/WeekStatus.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import SEO from '../../components/SEO/SEO.jsx'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx'
import { SITE_URL, getMarketOgImage } from '../../constants/seo.js'
import NotFound from '../NotFound/NotFound.jsx'
import {
  StatusSection,
  PageHeader,
  IconWrap,
  TitleGroup,
  ContextHeading,
} from './MarketCategoryDetails.styled.js'

// How many distinct categories a single named market carries across all of
// its rows (not just the latest week) - a market whose entire catalog is one
// category (e.g. a "stočna pijaca" that only ever sells Meso) makes its own
// /:categorySlug route byte-for-byte identical to the plain market route, so
// that case collapses this page's canonical/og:url onto the market page
// instead of asking search engines to index two URLs for one product list.
function useMarketCategoryCount(rows, grad, pijaca) {
  return useMemo(() => {
    if (!grad || !pijaca || pijaca === ALL_MARKETS) return null
    const categories = new Set()
    for (const row of rows) {
      const parsed = parseMesto(row.Mesto)
      if (parsed.grad === grad && parsed.pijaca === pijaca) categories.add(row.Kategorija)
    }
    return categories.size
  }, [rows, grad, pijaca])
}

// Products for one category, scoped to either a single named market or every
// market in the city (pijaca === ALL_MARKETS, the homepage's "Sve pijace u
// tom gradu" option), at that scope's own latest available week.
function useCategoryMarketData(rows, category, grad, pijaca) {
  return useMemo(() => {
    if (!category || !grad || !pijaca) return { filteredRows: [], weekLabel: '', isFallbackWeek: false, source: 'STIPS' }

    const scopedRows = rows.filter((row) => {
      if (row.Kategorija !== category) return false
      const parsed = parseMesto(row.Mesto)
      if (parsed.grad !== grad) return false
      if (pijaca !== ALL_MARKETS && parsed.pijaca !== pijaca) return false
      return true
    })
    const globalLatestWeek = getLatestWeekTime(rows)
    const scopedLatestWeek = getLatestWeekTime(scopedRows)

    const filteredRows =
      scopedLatestWeek === null ? [] : scopedRows.filter((row) => getRowTime(row) === scopedLatestWeek)
    const isFallbackWeek =
      scopedLatestWeek !== null && globalLatestWeek !== null && scopedLatestWeek !== globalLatestWeek
    const weekLabel = filteredRows[0] ? getRowRangeLabel(filteredRows[0]) : ''
    // See MarketDetails.jsx's useMarketData for the same convention - when
    // pijaca is ALL_MARKETS this scope can technically span both sources,
    // but the badge already only ever reflects filteredRows[0]'s own week
    // shape (see weekLabel above), so source follows the same row.
    const source = filteredRows[0]?.Source ? 'JKP' : 'STIPS'

    return { filteredRows, weekLabel, isFallbackWeek, source }
  }, [rows, category, grad, pijaca])
}

function MarketCategoryDetails({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug, categorySlug } = useParams()

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolveMarketSlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const category = useMemo(() => resolveCategoryBySlug(categorySlug), [categorySlug])
  const { filteredRows, weekLabel, isFallbackWeek, source } = useCategoryMarketData(rows, category, grad, pijaca)
  const marketCategoryCount = useMarketCategoryCount(rows, grad, pijaca)

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

  if (!grad || !pijaca || !category) {
    return <NotFound />
  }

  const Icon = getCategoryIcon(category)
  const isAllMarkets = pijaca === ALL_MARKETS
  const gradLabel = translateDataValue(t, 'grad', grad)
  const marketLabel = isAllMarkets ? t('marketCategoryDetails.allMarketsShort') : translateDataValue(t, 'pijaca', pijaca)
  const categoryLabel = t(`categories.${getCategorySlug(category)}`)

  // A single-category market's own /:categorySlug page lists the exact same
  // products as its /:marketSlug page, so canonicalize to the market page
  // rather than asking search engines to index two URLs for one product list
  // (see useMarketCategoryCount above).
  const canonicalUrl =
    marketCategoryCount === 1 ?
      `${SITE_URL}${buildMarketRoute(grad, pijaca, i18n.language)}`
    : `${SITE_URL}${buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(category, i18n.language), i18n.language)}`

  // "Sve pijace" (isAllMarkets) has no route of its own distinct from the
  // city page itself, so its trail skips straight from city to category
  // rather than inserting a non-clickable "Sve pijace" crumb.
  const breadcrumbItems = [
    { label: t('breadcrumbs.home'), to: '/' },
    { label: gradLabel, to: buildCityRoute(grad, i18n.language) },
    ...(isAllMarkets ? [] : [{ label: marketLabel, to: buildMarketRoute(grad, pijaca, i18n.language) }]),
    { label: categoryLabel },
  ]

  return (
    <>
      <SEO
        title={t('seo.category.title', { category: categoryLabel, market: marketLabel, city: gradLabel })}
        description={t('seo.category.description', { category: categoryLabel, market: marketLabel, city: gradLabel })}
        url={canonicalUrl}
        image={isAllMarkets ? undefined : getMarketOgImage(grad, pijaca)}
      />

      <Container>
        <Breadcrumbs items={breadcrumbItems} />

        <PageHeader>
          <IconWrap>
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable module-level reference, not created during render */}
            <Icon />
          </IconWrap>
          <TitleGroup>
            <ContextHeading>
              {t('marketCategoryDetails.contextHeading', {
                category: lowercaseFirst(t(`categories.${getCategorySlug(category)}`)),
                market: marketLabel,
                city: gradLabel,
              })}
            </ContextHeading>
          </TitleGroup>
        </PageHeader>

        <WeekStatus weekLabel={weekLabel} isFallbackWeek={isFallbackWeek} source={source} />
      </Container>

      <ProductGrid rows={filteredRows} selection={{ category, grad, pijaca }} />
    </>
  )
}

export default MarketCategoryDetails
