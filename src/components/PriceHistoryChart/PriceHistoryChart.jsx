import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
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
// palette in the order it first appears in the data (see buildSeries).
const FALLBACK_PALETTE = [theme.colors.chartSourceOrange, theme.colors.chartSourcePurple]

// STIPS/JKP keep their fixed brand colors regardless of series order; only a
// genuinely unrecognized source falls back to the cycled palette.
function getSourceColor(source, fallbackIndex) {
  if (source === 'STIPS') return theme.colors.primaryGreen
  if (source.includes('JKP')) return theme.colors.jkpBlue
  return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length]
}

// STIPS/JKP keep their existing translated copy; a genuinely new source has
// no dedicated translation key yet, so its own literal Source text (see
// useProductAnalytics.js's history) is shown as-is instead - same graceful-
// fallback convention translateDataValue already uses for untranslated data.
function getSourceDisplayLabel(t, source) {
  if (source === 'STIPS') return t('analytics.stipsSourceLabel')
  if (source === 'JKP Beogradske pijace') return t('analytics.jkpSourceLabel')
  return source
}

// `sources` is history's own stable, first-seen-chronologically order (see
// useProductAnalytics.js) - building series off it (rather than off
// whichever keys happen to be present on a single data point) means a
// source that's missing on some weeks but present on others still keeps a
// consistent color/position for its whole line instead of flickering.
function buildSeries(sources, t) {
  const series = []
  let fallbackIndex = 0
  for (const source of sources) {
    const isKnown = source === 'STIPS' || source.includes('JKP')
    const color = getSourceColor(source, isKnown ? 0 : fallbackIndex)
    if (!isKnown) fallbackIndex += 1
    series.push({ source, label: getSourceDisplayLabel(t, source), color })
  }
  return series
}

function CustomTooltip({ active, payload, label, series }) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null

  return (
    <TooltipCard>
      <TooltipDate>{label}</TooltipDate>
      {series.map(({ source, label: sourceLabel, color }) => {
        const entry = payload.find((item) => item.dataKey === source)
        if (!entry || entry.value === null || entry.value === undefined) return null
        return (
          <TooltipRow key={source}>
            <TooltipDot $color={color} />
            <TooltipSeriesName>{sourceLabel}</TooltipSeriesName>
            <TooltipValue>{t('productCard.avgPriceValue', { price: Number(entry.value).toFixed(2) })}</TooltipValue>
          </TooltipRow>
        )
      })}
    </TooltipCard>
  )
}

function PriceHistoryChart({ data, sources, missingSources = [] }) {
  const { t } = useTranslation()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noHistory')}</EmptyState>
  }

  const series = buildSeries(sources, t)

  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: ROTATED_AXIS_MARGIN_BOTTOM }}>
          <defs>
            {series.map(({ source, color }, index) => (
              <linearGradient key={source} id={`priceHistoryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
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
          {/* A single-source product has nothing to disambiguate, so the
              legend only earns its place once there's more than one line to
              tell apart - avoids a redundant one-item legend cluttering the
              graceful single-series fallback. */}
          {series.length > 1 && (
            <Legend
              verticalAlign="top"
              align="right"
              height={32}
              iconType="circle"
              wrapperStyle={{ fontSize: '0.8rem', fontFamily: theme.font.body }}
            />
          )}
          {series.map(({ source, label, color }, index) => (
            <Area
              key={source}
              type="monotone"
              dataKey={source}
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

      {missingSources.length > 0 && (
        <Note>
          {t('analytics.variationSourceGap', {
            sources: missingSources.map((source) => getSourceDisplayLabel(t, source)).join(', '),
          })}
        </Note>
      )}
    </ChartWrap>
  )
}

export default PriceHistoryChart
