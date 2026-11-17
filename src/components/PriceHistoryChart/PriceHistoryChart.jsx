import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { formatSeriesLabel, showsReferenceLine } from '../../utils/historySeries.js'
import { chartDefault } from '../../constants/chartText.js'
import {
  ChartWrap,
  EmptyState,
  Note,
  TooltipCard,
  TooltipDate,
  TooltipDot,
  TooltipRow,
  TooltipSeriesName,
  TooltipValue,
} from './PriceHistoryChart.styled.js'

// Any source beyond STIPS/JKP (a future third scraper) cycles through this
// palette in the order it first appears in the data.
const FALLBACK_PALETTE = [theme.colors.chartSourceOrange, theme.colors.chartSourcePurple]

// A lone line keeps the color of its source: STIPS green, JKP blue.
function getSourceColor(source) {
  if (source === 'STIPS') return theme.colors.primaryGreen
  if (source.includes('JKP')) return theme.colors.jkpBlue
  return FALLBACK_PALETTE[0]
}

// The lines of the chart with their names and colors. Two lines: the selected
// market is blue and the wholesale market (the reference) green - so the note
// under the chart ("the green line ...") is always true. One line: its source's
// color, as before. A line is named "{market} ({source})", the market as the rest
// of the site names it (translated like the page title and the cards).
function buildSeries(series, t) {
  const two = showsReferenceLine(series)
  return series.map((entry) => ({
    key: entry.key,
    label: formatSeriesLabel(translateDataValue(t, 'pijaca', entry.pijaca), entry.kind),
    color: two ? (entry.role === 'reference' ? theme.colors.primaryGreen : theme.colors.jkpBlue) : getSourceColor(entry.source),
  }))
}

function CustomTooltip({ active, payload, label, series }) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null

  return (
    <TooltipCard>
      <TooltipDate>{label}</TooltipDate>
      {series.map(({ key, label: seriesLabel, color }) => {
        const entry = payload.find((item) => item.dataKey === key)
        if (!entry || entry.value === null || entry.value === undefined) return null
        return (
          <TooltipRow key={key}>
            <TooltipDot $color={color} />
            <TooltipSeriesName>{seriesLabel}</TooltipSeriesName>
            <TooltipValue>{t('productCard.avgPriceValue', { price: Number(entry.value).toFixed(2) })}</TooltipValue>
          </TooltipRow>
        )
      })}
    </TooltipCard>
  )
}

// series: [{ key, role, pijaca, source, kind }] from buildHistorySeries;
// missingSeries: lines the family has but the chosen variety lacks.
function PriceHistoryChart({ onInteract, data, series: rawSeries, missingSeries = [] }) {
  const { t, i18n } = useTranslation()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noHistory')}</EmptyState>
  }

  const series = buildSeries(rawSeries, t)
  const missingLabels = buildSeries(missingSeries, t).map((entry) => entry.label)

  return (
    <ChartWrap onMouseEnter={onInteract} onTouchStart={onInteract} onClick={onInteract}>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: ROTATED_AXIS_MARGIN_BOTTOM }}>
          <defs>
            {series.map(({ key, color }, index) => (
              <linearGradient key={key} id={`priceHistoryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={theme.colors.borderLight} strokeDasharray="4 4" />
          <XAxis
            dataKey="weekLabel"
            tick={<RotatedAxisTick fontSize={11} />}
            height={ROTATED_AXIS_HEIGHT}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            content={<CustomTooltip series={series} />}
            cursor={{ stroke: theme.colors.chartGuide, strokeWidth: 1.5, strokeDasharray: '2 2' }}
          />
          {/* One line has nothing to tell apart: the legend only appears with two. */}
          {series.length > 1 && (
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: '0.8rem', fontFamily: theme.font.body }}
            />
          )}
          {series.map(({ key, label, color }, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={3.5}
              fill={`url(#priceHistoryGradient-${index})`}
              activeDot={{ r: 6, strokeWidth: 0, fill: color }}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {showsReferenceLine(rawSeries) && (
        <Note>
          {t('analytics.historyReferenceNote', { defaultValue: chartDefault(i18n.language, 'analytics.historyReferenceNote') })}
        </Note>
      )}

      {missingLabels.length > 0 && <Note>{t('analytics.variationSourceGap', { sources: missingLabels.join(', ') })}</Note>}
    </ChartWrap>
  )
}

export default PriceHistoryChart
