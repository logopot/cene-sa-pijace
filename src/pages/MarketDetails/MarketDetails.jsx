import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { LuArrowLeft, LuStore } from 'react-icons/lu'
import { parseMesto, resolveGradBySlug, resolvePijacaBySlug, buildCityRoute } from '../../utils/market.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getRowTime, getRowRangeLabel, getLatestWeekTime } from '../../utils/week.js'
import WeekStatus from '../../components/WeekStatus/WeekStatus.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import NotFound from '../NotFound/NotFound.jsx'
import {
  StatusSection,
  BackLink,
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
    if (!grad || !pijaca) return { filteredRows: [], weekLabel: '', isFallbackWeek: false }

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

    return { filteredRows, weekLabel, isFallbackWeek }
  }, [rows, grad, pijaca])
}

function MarketDetails({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug, marketSlug } = useParams()

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const pijaca = useMemo(() => resolvePijacaBySlug(rows, grad, marketSlug), [rows, grad, marketSlug])
  const { filteredRows, weekLabel, isFallbackWeek } = useMarketData(rows, grad, pijaca)

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

  return (
    <>
      <Container>
        <BackLink to={buildCityRoute(grad, i18n.language)}>
          <LuArrowLeft />
          {t('analytics.back')}
        </BackLink>

        <PageHeader>
          <IconWrap>
            <LuStore />
          </IconWrap>
          <TitleGroup>
            <MarketTitle>{translateDataValue(t, 'pijaca', pijaca)}</MarketTitle>
            <CityLabel>{translateDataValue(t, 'grad', grad)}</CityLabel>
          </TitleGroup>
        </PageHeader>

        <WeekStatus weekLabel={weekLabel} isFallbackWeek={isFallbackWeek} />
      </Container>

      <ProductGrid rows={filteredRows} selection={{ category: '', grad, pijaca }} />
    </>
  )
}

export default MarketDetails
