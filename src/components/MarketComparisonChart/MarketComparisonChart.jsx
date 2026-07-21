import { useTranslation } from 'react-i18next'
import { translateDataValue } from '../../utils/translateValue.js'
import ResponsiveBarChart from '../ResponsiveBarChart/ResponsiveBarChart.jsx'

function MarketComparisonChart({ data, highlightPijaca }) {
  const { t } = useTranslation()
  const items = data.map((entry) => ({
    key: entry.pijaca,
    label: translateDataValue(t, 'pijaca', entry.pijaca),
    price: entry.price,
  }))
  const note = items.length === 1 ? t('analytics.singleMarketNote') : undefined

  return (
    <ResponsiveBarChart
      data={items}
      highlightKey={highlightPijaca}
      emptyMessage={t('analytics.noMarketComparison')}
      note={note}
    />
  )
}

export default MarketComparisonChart
