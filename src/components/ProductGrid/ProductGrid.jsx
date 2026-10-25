import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { LuSearchX } from 'react-icons/lu'
import ProductCard from '../ProductCard/ProductCard.jsx'
import { Section, CardGrid, EmptyState, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction } from './ProductGrid.styled.js'

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
          <CardGrid>
            {rows.map((row, index) => (
              <ProductCard
                key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}-${index}`}
                row={row}
                selection={selection}
              />
            ))}
          </CardGrid>
        )}
      </Container>
    </Section>
  )
}

export default ProductGrid
