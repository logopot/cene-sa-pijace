import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import {
  ChartWrap,
  EmptyState,
  Note,
  Leaderboard,
  LeaderCard,
  LeaderLabel,
  LeaderValue,
} from './MarketComparisonChart.styled.js'

// Below this many markets, a mobile horizontal bar reads fine at the 300px
// floor; past it, each row gets a fixed 36px so a long list of markets never
// squeezes its bars/labels together - the same "grow with the data instead
// of squashing it" idea as WeeklyTrends' carousel sizing, just for height.
const MOBILE_ROW_HEIGHT = 36
const MOBILE_MIN_HEIGHT = 300
const DESKTOP_HEIGHT = 360

function formatPrice(value) {
  return value === null || value === undefined ? '-' : value.toFixed(2)
}

function MarketComparisonChart({ data, cheapest, priciest, highlightPijaca }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noMarketComparison')}</EmptyState>
  }

  // Raw pijaca stays on each entry for the highlight-match/tooltip key; label
  // is the display value shown on the axis and in the leaderboard.
  const chartData = data.map((entry) => ({ ...entry, label: translateDataValue(t, 'pijaca', entry.pijaca) }))

  // Widest label sets the category axis's own width on mobile (see YAxis
  // below) - a fixed width either clips long market names or wastes space on
  // a page of short ones, so this scales with whatever's actually in the data.
  const longestLabelLength = Math.max(...chartData.map((entry) => entry.label.length))
  const yAxisWidth = Math.min(140, Math.max(70, longestLabelLength * 7))
  const chartHeight = isMobile ? Math.max(MOBILE_MIN_HEIGHT, chartData.length * MOBILE_ROW_HEIGHT) : DESKTOP_HEIGHT
  // Recharts' own layout terminology: "vertical" lays bars out horizontally
  // (value grows left-to-right, categories stack down the Y axis) - the
  // mobile orientation this component switches to once rotated desktop
  // labels (see RotatedAxisTick) would rather be full-height rows of
  // horizontal, left-aligned market names instead.
  const barRadius = isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]

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
        <ResponsiveContainer width="100%" height={chartHeight}>
          {isMobile ?
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              barSize={16}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.borderLight} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={yAxisWidth} interval={0} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} RSD`, t('analytics.priceLabel')]} />
              <Bar dataKey="price" radius={barRadius}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.pijaca}
                    fill={entry.pijaca === highlightPijaca ? theme.colors.primaryGreen : theme.colors.border}
                  />
                ))}
              </Bar>
            </BarChart>
          : <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: ROTATED_AXIS_MARGIN_BOTTOM }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.borderLight} />
              <XAxis
                dataKey="label"
                tick={<RotatedAxisTick fontSize={14} />}
                height={ROTATED_AXIS_HEIGHT}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} RSD`, t('analytics.priceLabel')]} />
              <Bar dataKey="price" radius={barRadius}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.pijaca}
                    fill={entry.pijaca === highlightPijaca ? theme.colors.primaryGreen : theme.colors.border}
                  />
                ))}
              </Bar>
            </BarChart>
          }
        </ResponsiveContainer>
      </ChartWrap>

      {data.length === 1 && <Note>{t('analytics.singleMarketNote')}</Note>}
    </>
  )
}

export default MarketComparisonChart
