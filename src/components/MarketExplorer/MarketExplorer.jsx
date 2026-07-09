import { useTranslation } from 'react-i18next'
import { Alert, Container, Spinner } from 'react-bootstrap'
import { useMarketExplorer } from '../../hooks/useMarketExplorer.js'
import Hero from '../Hero/Hero.jsx'
import FilterBar from '../FilterBar/FilterBar.jsx'
import WeeklyTrends from '../WeeklyTrends/WeeklyTrends.jsx'
import MarketShowcase from '../MarketShowcase/MarketShowcase.jsx'
import HowItWorks from '../HowItWorks/HowItWorks.jsx'
import { StatusSection } from './MarketExplorer.styled.js'

function MarketExplorer({ rows, loading, error }) {
  const { t } = useTranslation()
  const explorer = useMarketExplorer(rows)

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

  return (
    <>
      <Hero />

      <FilterBar
        category={explorer.category}
        grad={explorer.grad}
        pijaca={explorer.pijaca}
        categories={explorer.categories}
        cities={explorer.cities}
        markets={explorer.markets}
        onCategoryChange={explorer.setCategory}
        onGradChange={explorer.setGrad}
        onPijacaChange={explorer.setPijaca}
      />

      <WeeklyTrends rows={explorer.weeklyDrops} />
      <MarketShowcase markets={explorer.showcaseMarkets} />
      <HowItWorks />
    </>
  )
}

export default MarketExplorer
