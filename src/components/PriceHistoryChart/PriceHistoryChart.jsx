import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  useChartHeight,
  useChartWidth,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from 'recharts'
import { theme } from '../../styles/theme.js'
import { ROTATED_AXIS_HEIGHT, ROTATED_AXIS_MARGIN_BOTTOM, RotatedAxisTick } from '../../utils/chartAxisTick.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { formatSeriesLabel, locateCursor, selectHoverPoints, showsReferenceLine } from '../../utils/historySeries.js'
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
  TooltipSlot,
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

// What the cursor is over is decided by PriceHistoryChart (below), not by Recharts'
// shared tooltip (which follows the nearest date of ALL series and so shows another
// series' point when the cursor sits on a line between that series' own records).
// This layer lives inside the chart only because the scales do: it hands them (and the
// plot area) upward after every render, and draws the active dots of the points the
// tooltip shows - dots and tooltip always come from the same series and date. It
// takes no pointer events itself.
const TOOLTIP_WIDTH = 250
const TOOLTIP_ROW_HEIGHT = 26
const TOOLTIP_BASE_HEIGHT = 56
const TOOLTIP_GAP = 14

function HoverLayer({ series, hover, scalesRef, data }) {
  const { t } = useTranslation()
  const chartWidth = useChartWidth()
  const chartHeight = useChartHeight()
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  const ready = Boolean(xScale && yScale && plot)
  const offset = ready && typeof xScale.bandwidth === 'function' ? xScale.bandwidth() / 2 : 0
  // Recharts keys the category axis by label - or, when some dates share a label
  // (a STIPS week start and a JKP day can), by position in the data.
  const xOf = (index) => {
    const byLabel = xScale(data[index].weekLabel)
    return (Number.isFinite(byLabel) ? byLabel : xScale(index)) + offset
  }
  const yOf = (value) => yScale(value)

  useEffect(() => {
    scalesRef.current = ready ? { xOf, yOf, plot } : null
  })
  if (!ready) return null

  const byKey = new Map(series.map((entry) => [entry.key, entry]))

  // The tooltip is drawn here, inside the chart, from our own state - not by Recharts'
  // Tooltip, whose visibility depends on its own mouse tracking and so can lag or stay
  // hidden when the pointer arrives by another route. It sits to the right of the
  // pointer, flipped to the left near the right edge, and never leaves the chart.
  const tooltipHeight = hover ? TOOLTIP_BASE_HEIGHT + hover.points.length * TOOLTIP_ROW_HEIGHT : 0
  const flip = hover ? hover.anchor.x + TOOLTIP_GAP + TOOLTIP_WIDTH > chartWidth : false
  const tooltipX = hover ? (flip ? hover.anchor.x - TOOLTIP_GAP - TOOLTIP_WIDTH : hover.anchor.x + TOOLTIP_GAP) : 0
  const tooltipY = hover ? Math.min(Math.max(hover.anchor.y - tooltipHeight - 8, 0), Math.max(chartHeight - tooltipHeight, 0)) : 0

  return (
    <g>
      {hover && (
        <foreignObject x={Math.max(tooltipX, 0)} y={tooltipY} width={TOOLTIP_WIDTH} height={tooltipHeight} pointerEvents="none">
          <TooltipSlot $alignEnd={flip}>
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
          </TooltipSlot>
        </foreignObject>
      )}
      {hover?.points.map((point) => (
        <circle
          key={point.key}
          cx={xOf(point.index)}
          cy={yOf(point.value)}
          r={6}
          fill={byKey.get(point.key).color}
          pointerEvents="none"
        />
      ))}
    </g>
  )
}

// series: [{ key, role, pijaca, source, kind, segments }] from buildHistorySeries;
// missingSeries: lines the family has but the chosen variety lacks.
function PriceHistoryChart({ onInteract, data, series: rawSeries, missingSeries = [] }) {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)
  const scalesRef = useRef(null)

  // A finger or mouse outside the chart clears the tooltip (touch has no "leave").
  useEffect(() => {
    const clear = (event) => {
      if (!wrapRef.current?.contains(event.target)) setHover(null)
    }
    document.addEventListener('touchstart', clear, { passive: true })
    return () => document.removeEventListener('touchstart', clear)
  }, [])

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noHistory')}</EmptyState>
  }

  const series = buildSeries(rawSeries, t)
  const missingLabels = buildSeries(missingSeries, t).map((entry) => entry.label)

  // One handler for everything: the pointer's screen position against the chart's
  // bounding box - whatever element is under it (rect, line, dot, area, svg, axis).
  // Outside the plot area, or in a gap of every line, there is no tooltip.
  const track = (clientX, clientY) => {
    const scales = scalesRef.current
    const svg = wrapRef.current?.querySelector('.recharts-wrapper > svg')
    if (!scales || !svg) return
    const cursor = locateCursor({ clientX, clientY, box: svg.getBoundingClientRect(), plot: scales.plot })
    if (!cursor.inside) {
      setHover(null)
      return
    }
    const points = selectHoverPoints({
      series: rawSeries,
      cursor,
      xOf: scales.xOf,
      yOf: scales.yOf,
      valueAt: (index, key) => data[index][key],
    })
    setHover(points.length > 0 ? { points, anchor: cursor } : null)
  }
  const touch = (event) => {
    if (event.touches.length > 0) track(event.touches[0].clientX, event.touches[0].clientY)
  }

  return (
    <ChartWrap
      ref={wrapRef}
      onMouseEnter={onInteract}
      onMouseMove={(event) => track(event.clientX, event.clientY)}
      onPointerMove={(event) => {
        if (event.pointerType !== 'touch') track(event.clientX, event.clientY)
      }}
      onMouseLeave={() => setHover(null)}
      onPointerLeave={() => setHover(null)}
      onTouchStart={(event) => {
        onInteract?.()
        touch(event)
      }}
      onTouchMove={touch}
      onClick={onInteract}
    >
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
          <HoverLayer data={data} series={series} hover={hover} scalesRef={scalesRef} />
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
