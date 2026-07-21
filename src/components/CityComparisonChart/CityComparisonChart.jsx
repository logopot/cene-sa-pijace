import { useTranslation } from 'react-i18next'
import ResponsiveBarChart from '../ResponsiveBarChart/ResponsiveBarChart.jsx'

function CityComparisonChart({ data, highlightGrad }) {
  const { t } = useTranslation()
  const items = data.map((entry) => ({ key: entry.grad, label: entry.grad, price: entry.price }))

  return <ResponsiveBarChart data={items} highlightKey={highlightGrad} emptyMessage={t('analytics.noComparison')} />
}

export default CityComparisonChart
