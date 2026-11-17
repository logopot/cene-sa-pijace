import { useTranslation } from 'react-i18next'
import { translateDataValue } from '../../utils/translateValue.js'
import ResponsiveBarChart from '../ResponsiveBarChart/ResponsiveBarChart.jsx'
import { freshnessDefault } from '../../constants/freshnessText.js'
import { StaleList, StaleItem } from './MarketComparisonChart.styled.js'

// `data`: the fresh markets (the cheapest/priciest come from these); `staleMarkets`:
// markets whose newest record is too old - listed apart as "Last price: dd.mm.yyyy.",
// never part of the lowest/highest price or the "cheapest" highlight.
function MarketComparisonChart({ data, staleMarkets = [], highlightPijaca }) {
  const { t, i18n } = useTranslation()
  const items = data.map((entry) => ({
    key: entry.pijaca,
    label: translateDataValue(t, 'pijaca', entry.pijaca),
    price: entry.price,
  }))
  const note = items.length === 1 ? t('analytics.singleMarketNote') : undefined

  return (
    <>
      <ResponsiveBarChart
        data={items}
        highlightKey={highlightPijaca}
        emptyMessage={t('analytics.noMarketComparison')}
        note={note}
      />
      {staleMarkets.length > 0 && (
        <StaleList>
          {staleMarkets.map((entry) => (
            <StaleItem key={entry.pijaca}>
              {translateDataValue(t, 'pijaca', entry.pijaca)}: {entry.price.toFixed(2)} RSD ·{' '}
              {t('analytics.lastPriceOn', {
                date: entry.lastDate,
                defaultValue: freshnessDefault(i18n.language, 'analytics.lastPriceOn'),
              })}
            </StaleItem>
          ))}
        </StaleList>
      )}
    </>
  )
}

export default MarketComparisonChart
