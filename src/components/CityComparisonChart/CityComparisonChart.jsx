import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ChartWrap,
  EmptyState,
  Leaderboard,
  LeaderCard,
  LeaderLabel,
  LeaderValue,
} from './CityComparisonChart.styled.js'

function formatPrice(value) {
  return value === null || value === undefined ? '-' : value.toFixed(2)
}

function CityComparisonChart({ data, cheapest, priciest, highlightGrad }) {
  const { t } = useTranslation()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noComparison')}</EmptyState>
  }

  return (
    <>
      <Leaderboard>
        <LeaderCard $variant="cheapest">
          <LeaderLabel>{t('analytics.cheapest')}</LeaderLabel>
          <LeaderValue>{cheapest ? `${cheapest.grad} · ${formatPrice(cheapest.price)}` : '-'}</LeaderValue>
        </LeaderCard>
        <LeaderCard $variant="priciest">
          <LeaderLabel>{t('analytics.priciest')}</LeaderLabel>
          <LeaderValue>{priciest ? `${priciest.grad} · ${formatPrice(priciest.price)}` : '-'}</LeaderValue>
        </LeaderCard>
      </Leaderboard>

      <ChartWrap>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
            <XAxis dataKey="grad" tick={{ fontSize: 14 }} interval={0} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip formatter={(value) => [Number(value).toFixed(2), t('analytics.priceLabel')]} />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.grad}
                  fill={entry.grad === highlightGrad ? 'var(--color-primary-green)' : 'var(--color-border)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrap>
    </>
  )
}

export default CityComparisonChart
