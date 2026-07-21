import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
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
} from './ResponsiveBarChart.styled.js'

// Below this many entries, a mobile horizontal bar reads fine at the 300px
// floor; past it, each row gets a fixed 36px so a long list never squeezes
// its bars/labels together.
const MOBILE_ROW_HEIGHT = 36
const MOBILE_MIN_HEIGHT = 300
const DESKTOP_HEIGHT = 360

function formatPrice(value) {
  return value === null || value === undefined ? '-' : value.toFixed(2)
}

// Shared by every price bar-chart-with-leaderboard on the product analytics
// page (see CityComparisonChart.jsx and MarketComparisonChart.jsx, both thin
// adapters over this one implementation) - keeps the mobile/desktop
// orientation switch, dynamic mobile height, and leaderboard/tooltip
// behavior identical everywhere instead of drifting between copies.
// `data` entries are `{ key, label, price }`, already sorted ascending by
// price (every caller's own hook already produces that order for its own
// cheapest/priciest fields) - cheapest/priciest here are read directly off
// the first/last entry rather than recomputed.
function ResponsiveBarChart({ data, highlightKey, emptyMessage, note }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  if (data.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>
  }

  const cheapest = data[0]
  const priciest = data[data.length - 1]
  // Widest label sets the category axis's own width on mobile (see YAxis
  // below) - a fixed width either clips long names or wastes space on a page
  // of short ones, so this scales with whatever's actually in the data.
  const longestLabelLength = Math.max(...data.map((entry) => entry.label.length))
  const yAxisWidth = Math.min(140, Math.max(70, longestLabelLength * 7))
  const chartHeight = isMobile ? Math.max(MOBILE_MIN_HEIGHT, data.length * MOBILE_ROW_HEIGHT) : DESKTOP_HEIGHT
  // Recharts' own layout terminology: "vertical" lays bars out horizontally
  // (value grows left-to-right, categories stack down the Y axis) - the
  // mobile orientation this switches to once rotated desktop labels (see
  // RotatedAxisTick) would rather be full-height rows of horizontal,
  // left-aligned names instead.
  const barRadius = isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]
  const tooltipFormatter = (value) => [`${Number(value).toFixed(2)} RSD`, t('analytics.priceLabel')]

  return (
    <>
      <Leaderboard>
        <LeaderCard $variant="cheapest">
          <LeaderLabel>{t('analytics.cheapest')}</LeaderLabel>
          <LeaderValue>{`${cheapest.label} · ${formatPrice(cheapest.price)}`}</LeaderValue>
        </LeaderCard>
        <LeaderCard $variant="priciest">
          <LeaderLabel>{t('analytics.priciest')}</LeaderLabel>
          <LeaderValue>{`${priciest.label} · ${formatPrice(priciest.price)}`}</LeaderValue>
        </LeaderCard>
      </Leaderboard>

      <ChartWrap>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {isMobile ?
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 8 }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.borderLight} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={yAxisWidth} interval={0} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="price" radius={barRadius}>
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.key === highlightKey ? theme.colors.primaryGreen : theme.colors.border}
                  />
                ))}
              </Bar>
            </BarChart>
          : <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: ROTATED_AXIS_MARGIN_BOTTOM }} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.borderLight} />
              <XAxis
                dataKey="label"
                tick={<RotatedAxisTick fontSize={14} />}
                height={ROTATED_AXIS_HEIGHT}
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={tooltipFormatter} />
              <Bar dataKey="price" radius={barRadius}>
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.key === highlightKey ? theme.colors.primaryGreen : theme.colors.border}
                  />
                ))}
              </Bar>
            </BarChart>
          }
        </ResponsiveContainer>
      </ChartWrap>

      {note && <Note>{note}</Note>}
    </>
  )
}

export default ResponsiveBarChart
