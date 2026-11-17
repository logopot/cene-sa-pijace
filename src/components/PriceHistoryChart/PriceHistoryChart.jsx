import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from 'recharts'
import { theme } from '../../styles/theme.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { formatSeriesLabel, selectHoverPoints, showsReferenceLine } from '../../utils/historySeries.js'
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
    segments: entry.segments ?? [],
    label: formatSeriesLabel(translateDataValue(t, 'pijaca', entry.pijaca), entry.kind),
    color: two ? (entry.role === 'reference' ? theme.colors.primaryGreen : theme.colors.jkpBlue) : getSourceColor(entry.source),
  }))
}

// What the cursor is over, decided here and not by Recharts' shared tooltip (which
// follows the nearest date of ALL series and so shows another series' point when
// the cursor sits on a line between that series' own records). A transparent layer
// over the plot area reads the mouse/finger, asks selectHoverPoints which series
// has its line under it, shows exactly those points and reports them upward for the
// tooltip - dots and tooltip always come from the same series and date.
function HoverLayer({ data, series, hover, onHover }) {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  if (!xScale || !yScale || !plot) return null

  const offset = typeof xScale.bandwidth === 'function' ? xScale.bandwidth() / 2 : 0
  // Recharts keys the category axis by label - or, when some dates share a label
  // (a STIPS week start and a JKP day can), by position in the data.
  const xOf = (index) => {
    const byLabel = xScale(data[index].weekLabel)
    return (Number.isFinite(byLabel) ? byLabel : xScale(index)) + offset
  }
  const yOf = (value) => yScale(value)

  const track = (clientX, clientY, target) => {
    const box = (target.ownerSVGElement ?? target).getBoundingClientRect()
    const cursor = { x: clientX - box.left, y: clientY - box.top }
    const points = selectHoverPoints({ series, cursor, xOf, yOf, valueAt: (index, key) => data[index][key] })
    onHover(points.length > 0 ? { points, anchor: cursor } : null)
  }
  const colorOf = new Map(series.map((entry) => [entry.key, entry.color]))

  return (
    <g>
      <rect
        x={plot.x}
        y={plot.y}
        width={plot.width}
        height={plot.height}
        fill="transparent"
        onMouseMove={(event) => track(event.clientX, event.clientY, event.currentTarget)}
        onMouseLeave={() => onHover(null)}
        onTouchStart={(event) => track(event.touches[0].clientX, event.touches[0].clientY, event.currentTarget)}
        onTouchMove={(event) => track(event.touches[0].clientX, event.touches[0].clientY, event.currentTarget)}
      />
      {hover?.points.map((point) => (
        <circle
          key={point.key}
          cx={xOf(point.index)}
          cy={yOf(point.value)}
          r={6}
          fill={colorOf.get(point.key)}
          pointerEvents="none"
        />
      ))}
    </g>
  )
}

function HoverTooltip({ hover, data, series }) {
  const { t } = useTranslation()
  if (!hover) return null
  const byKey = new Map(series.map((entry) => [entry.key, entry]))
  return (
    <TooltipCard>
      <TooltipDate>{data[hover.points[0].index].weekLabel}</TooltipDate>
      {hover.points.map((point) => (
        <TooltipRow key={point.key}>
          <TooltipDot $color={byKey.get(point.key).color} />
          <TooltipSeriesName>{byKey.get(point.key).label}</TooltipSeriesName>
          <TooltipValue>{t('productCard.avgPriceValue', { price: Number(point.value).toFixed(2) })}</TooltipValue>
        </TooltipRow>
      ))}
    </TooltipCard>
  )
}

// series: [{ key, role, pijaca, source, kind, segments }] from buildHistorySeries;
// missingSeries: lines the family has but the chosen variety lacks.
function PriceHistoryChart({ onInteract, data, series: rawSeries, missingSeries = [] }) {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = useState(null)

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
            active={Boolean(hover)}
            position={hover ? { x: hover.anchor.x + 14, y: Math.max(hover.anchor.y - 64, 0) } : undefined}
            content={<HoverTooltip hover={hover} data={data} series={series} />}
            cursor={false}
            isAnimationActive={false}
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
          {/* One Area per SEGMENT of a series: a line and its shaded area never run
              through a gap in that series' records, and a lone record is a visible
              dot (the same look as the hover dot, smaller). The legend is given
              explicitly: one entry per series, whatever its segments. */}
          {series.flatMap(({ key, label, color, segments }, seriesIndex) =>
            segments.map((segment, n) => (
              <Area
                key={`${key}-${segment.dataKey}`}
                type="monotone"
                dataKey={segment.dataKey}
                name={label}
                legendType={n === 0 ? 'circle' : 'none'}
                stroke={color}
                strokeWidth={3.5}
                fill={`url(#priceHistoryGradient-${seriesIndex})`}
                dot={segment.isolated ? { r: 3.5, strokeWidth: 0, fill: color } : false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )),
          )}
          <HoverLayer data={data} series={series} hover={hover} onHover={setHover} />
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
