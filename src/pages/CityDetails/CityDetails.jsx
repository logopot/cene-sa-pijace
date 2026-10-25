import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import PageSkeleton from '../../components/PageSkeleton/PageSkeleton.jsx'
import { LuStore } from 'react-icons/lu'
import SEO from '../../components/SEO/SEO.jsx'
import { SITE_URL, getCityOgImage } from '../../constants/seo.js'
import { parseMesto, resolveGradBySlug, buildCityRoute, buildMarketRoute } from '../../utils/market.js'
import { translateDataValue } from '../../utils/translateValue.js'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs.jsx'
import GlobalFilterBar from '../../components/FilterBar/GlobalFilterBar.jsx'
import NotFound from '../NotFound/NotFound.jsx'
import {
  StatusSection,
  PageHeader,
  IconWrap,
  CityTitle,
  MarketTileLink,
  MarketTileCard,
  MarketTileName,
} from './CityDetails.styled.js'

// Every distinct named market within the resolved city (e.g. Beograd's
// Kalenić/Skadarlija/Kvantaška pijaca), each becoming its own card that
// drills into /grad/:citySlug/:marketSlug (see MarketDetails).
function useCityMarkets(rows, grad) {
  return useMemo(() => {
    if (!grad) return []
    const seen = new Set()
    for (const row of rows) {
      const parsed = parseMesto(row.Mesto)
      if (parsed.grad === grad) seen.add(parsed.pijaca)
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b))
  }, [rows, grad])
}

function CityDetails({ rows, loading, error }) {
  const { t, i18n } = useTranslation()
  const { citySlug } = useParams()

  const grad = useMemo(() => resolveGradBySlug(rows, citySlug), [rows, citySlug])
  const markets = useCityMarkets(rows, grad)

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

  if (!grad) {
    return <NotFound />
  }

  const gradLabel = translateDataValue(t, 'grad', grad)

  return (
    <>
      <SEO
        title={t('seo.city.title', { city: gradLabel })}
        description={t('seo.city.description', { city: gradLabel })}
        url={`${SITE_URL}${buildCityRoute(grad, i18n.language)}`}
        image={getCityOgImage(grad)}
      />
      <GlobalFilterBar />

      <Container>
        <Breadcrumbs
          items={[
            { label: t('breadcrumbs.home'), to: '/' },
            { label: gradLabel },
          ]}
        />

        <PageHeader>
          <IconWrap>
            <LuStore />
          </IconWrap>
          <CityTitle>{gradLabel}</CityTitle>
        </PageHeader>

        <Row className="g-3">
          {markets.map((pijaca) => (
            <Col key={pijaca} xs={12} sm={6} md={4} lg={3}>
              <MarketTileLink to={buildMarketRoute(grad, pijaca, i18n.language)}>
                <MarketTileCard>
                  <MarketTileName>{translateDataValue(t, 'pijaca', pijaca)}</MarketTileName>
                </MarketTileCard>
              </MarketTileLink>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  )
}

export default CityDetails
