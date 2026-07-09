import { useTranslation } from 'react-i18next'
import { Col, Container, Row } from 'react-bootstrap'
import MarketCard from '../MarketCard/MarketCard.jsx'
import { Section, Heading, Subtitle } from './MarketShowcase.styled.js'

function MarketShowcase({ markets }) {
  const { t } = useTranslation()

  return (
    <Section>
      <Container>
        <Heading>{t('landing.title')}</Heading>
        <Subtitle>{t('landing.subtitle')}</Subtitle>
        <Row className="g-3">
          {markets.map((market) => (
            <Col key={market.mesto} xs={12} sm={6} md={4} lg={3}>
              <MarketCard grad={market.grad} pijaca={market.pijaca} />
            </Col>
          ))}
        </Row>
      </Container>
    </Section>
  )
}

export default MarketShowcase
