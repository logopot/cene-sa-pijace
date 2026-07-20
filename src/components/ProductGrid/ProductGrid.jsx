import { useTranslation } from 'react-i18next'
import { Col, Container, Row } from 'react-bootstrap'
import { LuSearchX } from 'react-icons/lu'
import ProductCard from '../ProductCard/ProductCard.jsx'
import { Section, EmptyState, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction } from './ProductGrid.styled.js'

function ProductGrid({ rows, selection }) {
  const { t } = useTranslation()

  return (
    <Section>
      <Container>
        {rows.length === 0 ? (
          <EmptyState>
            <EmptyIcon aria-hidden="true">
              <LuSearchX />
            </EmptyIcon>
            <EmptyTitle>{t('results.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('results.emptyDescription')}</EmptyDescription>
            <EmptyAction to="/">{t('results.emptyAction')}</EmptyAction>
          </EmptyState>
        ) : (
          <Row className="g-3">
            {rows.map((row, index) => (
              <Col key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}-${index}`} xs={12} sm={12} md={6} lg={4} xl={3}>
                <ProductCard row={row} selection={selection} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </Section>
  )
}

export default ProductGrid
