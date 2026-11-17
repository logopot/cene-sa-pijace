import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { LuSearchX } from 'react-icons/lu'
import ProductCard from '../ProductCard/ProductCard.jsx'
import { useFreshness } from '../../hooks/useFreshness.js'
import { freshnessDefault } from '../../constants/freshnessText.js'
import { Section, CardGrid, EmptyState, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction, NoCurrentData } from './ProductGrid.styled.js'

function ProductGrid({ rows: listed, selection }) {
  const { t, i18n } = useTranslation()
  // Fresh products first, stale ones (shown as "last price") after them; the order
  // inside each group is the list's own.
  const { isFresh } = useFreshness()
  const rows = [...listed.filter(isFresh), ...listed.filter((row) => !isFresh(row))]
  const noCurrentData = rows.length > 0 && !isFresh(rows[0])

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
          <>
          {noCurrentData && (
            <NoCurrentData role="note">
              {t('results.noCurrentData', { defaultValue: freshnessDefault(i18n.language, 'results.noCurrentData') })}
            </NoCurrentData>
          )}
          <CardGrid>
            {rows.map((row, index) => (
              <ProductCard
                key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}-${index}`}
                row={row}
                selection={selection}
              />
            ))}
          </CardGrid>
          </>
        )}
      </Container>
    </Section>
  )
}

export default ProductGrid
