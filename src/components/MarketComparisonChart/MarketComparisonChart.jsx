import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
import {
  ChartWrap,
  EmptyState,
  Note,
  Leaderboard,
  LeaderCard,
  LeaderLabel,
  LeaderValue,
} from './MarketComparisonChart.styled.js'

function formatPrice(value) {
  return value === null || value === undefined ? '-' : value.toFixed(2)
}

function MarketComparisonChart({ data, cheapest, priciest, highlightPijaca }) {
  const { t } = useTranslation()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noMarketComparison')}</EmptyState>
  }

  // Raw pijaca stays on each entry for the highlight-match/tooltip key; label
  // is the display value shown on the axis and in the leaderboard.
  const chartData = data.map((entry) => ({ ...entry, label: translateDataValue(t, 'pijaca', entry.pijaca) }))

  return (
    <>
      <Leaderboard>
        <LeaderCard $variant="cheapest">
          <LeaderLabel>{t('analytics.cheapest')}</LeaderLabel>
          <LeaderValue>
            {cheapest ? `${translateDataValue(t, 'pijaca', cheapest.pijaca)} · ${formatPrice(cheapest.price)}` : '-'}
          </LeaderValue>
        </LeaderCard>
        <LeaderCard $variant="priciest">
          <LeaderLabel>{t('analytics.priciest')}</LeaderLabel>
          <LeaderValue>
            {priciest ? `${translateDataValue(t, 'pijaca', priciest.pijaca)} · ${formatPrice(priciest.price)}` : '-'}
          </LeaderValue>
        </LeaderCard>
      </Leaderboard>

      <ChartWrap>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: ROTATED_AXIS_MARGIN_BOTTOM }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.borderLight} />
            <XAxis dataKey="label" tick={<RotatedAxisTick fontSize={14} />} height={ROTATED_AXIS_HEIGHT} interval={0} />
            <YAxis tick={{ fontSize: 11 }} width={48} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} RSD`, t('analytics.priceLabel')]} />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.pijaca}
                  fill={entry.pijaca === highlightPijaca ? theme.colors.primaryGreen : theme.colors.border}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrap>

      {data.length === 1 && <Note>{t('analytics.singleMarketNote')}</Note>}
    </>
  )
}

export default MarketComparisonChart
