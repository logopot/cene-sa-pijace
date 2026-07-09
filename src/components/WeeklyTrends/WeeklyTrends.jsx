import { useTranslation } from 'react-i18next'
import { Col, Container, Row } from 'react-bootstrap'
import WeeklyDealCard from '../WeeklyDealCard/WeeklyDealCard.jsx'
import { Section, Heading, Subtitle } from './WeeklyTrends.styled.js'

function WeeklyTrends({ rows }) {
  const { t } = useTranslation()

  if (rows.length === 0) return null

  return (
    <Section>
      <Container>
        <Heading>{t('weeklyTrends.title')}</Heading>
        <Subtitle>{t('weeklyTrends.subtitle')}</Subtitle>
        <Row className="g-3">
          {rows.map((row) => (
            <Col key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}`} xs={12} sm={6} lg={3}>
              <WeeklyDealCard row={row} />
            </Col>
          ))}
        </Row>
      </Container>
    </Section>
  )
}

export default WeeklyTrends
