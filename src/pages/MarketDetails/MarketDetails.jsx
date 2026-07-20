import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { LuStore } from 'react-icons/lu'
import { parseMesto, resolveGradBySlug, resolvePijacaBySlug, buildCityRoute, buildMarketRoute } from '../../utils/market.js'
import { translateDataValue } from '../../utils/translateValue.js'
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
  MarketTitle,
  CityLabel,
} from './MarketDetails.styled.js'

// Products for this one specific market only (not the whole city - see
// CityDetails for the city-level aggregate), at that market's own latest
// available week.
function useMarketData(rows, grad, pijaca) {
  return useMemo(() => {
    if (!grad || !pijaca) return { filteredRows: [], weekLabel: '', isFallbackWeek: false, source: 'STIPS' }

    const marketRows = rows.filter((row) => {
      const parsed = parseMesto(row.Mesto)
      return parsed.grad === grad && parsed.pijaca === pijaca
    })
    const globalLatestWeek = getLatestWeekTime(rows)
    const marketLatestWeek = getLatestWeekTime(marketRows)

    const filteredRows =
      marketLatestWeek === null ? [] : marketRows.filter((row) => getRowTime(row) === marketLatestWeek)
    const isFallbackWeek =
      marketLatestWeek !== null && globalLatestWeek !== null && marketLatestWeek !== globalLatestWeek
    const weekLabel = filteredRows[0] ? getRowRangeLabel(filteredRows[0]) : ''
    // row.Source is only ever populated on JKP archive rows (see
    // useProductAnalytics.js's same convention) - every market here is
    // single-source, so the first row's shape speaks for the whole batch.
    const source = filteredRows[0]?.Source ? 'JKP' : 'STIPS'

    return { filteredRows, weekLabel, isFallbackWeek, source }
  }, [rows, grad, pijaca])
}

function MarketDetails({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug } = useParams()

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolvePijacaBySlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const { filteredRows, weekLabel, isFallbackWeek, source } = useMarketData(rows, grad, pijaca)

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

  if (!grad || !pijaca) {
    return <NotFound />
  }

  const pijacaLabel = translateDataValue(t, 'pijaca', pijaca)
  const gradLabel = translateDataValue(t, 'grad', grad)

  return (
    <>
      <SEO
        title={t('seo.market.title', { market: pijacaLabel, city: gradLabel })}
        description={t('seo.market.description', { market: pijacaLabel, city: gradLabel })}
        url={`${SITE_URL}${buildMarketRoute(grad, pijaca, i18n.language)}`}
        image={getMarketOgImage(grad, pijaca)}
      />

      <Container>
        <Breadcrumbs
          items={[
            { label: t('breadcrumbs.home'), to: '/' },
            {
              label: gradLabel,
              to: buildCityRoute(grad, i18n.language),
              mobileLabel: t('navigation.backToCityMarkets', { city: gradLabel }),
            },
            { label: pijacaLabel },
          ]}
        />

        <PageHeader>
          <IconWrap>
            <LuStore />
          </IconWrap>
          <TitleGroup>
            <MarketTitle>{pijacaLabel}</MarketTitle>
            <CityLabel>{gradLabel}</CityLabel>
          </TitleGroup>
        </PageHeader>

        <WeekStatus weekLabel={weekLabel} isFallbackWeek={isFallbackWeek} source={source} />
      </Container>

      <ProductGrid rows={filteredRows} selection={{ category: '', grad, pijaca }} />
    </>
  )
}

export default MarketDetails
