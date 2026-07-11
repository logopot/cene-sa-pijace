import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { theme } from '../../styles/theme.js'
import {
  ChartWrap,
  EmptyState,
  TooltipCard,
  TooltipDate,
  TooltipDot,
  TooltipRow,
  TooltipSeriesName,
  TooltipValue,
} from './PriceHistoryChart.styled.js'

const SERIES_META = {
  stipsPrice: { color: theme.colors.primaryGreen, labelKey: 'analytics.stipsSourceLabel' },
  jkpPrice: { color: theme.colors.jkpBlue, labelKey: 'analytics.jkpSourceLabel' },
}

function CustomTooltip({ active, payload, label }) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null

  return (
    <TooltipCard>
      <TooltipDate>{label}</TooltipDate>
      {payload.map((entry) => {
        const meta = SERIES_META[entry.dataKey]
        if (!meta || entry.value === null || entry.value === undefined) return null
        return (
          <TooltipRow key={entry.dataKey}>
            <TooltipDot $color={meta.color} />
            <TooltipSeriesName>{t(meta.labelKey)}</TooltipSeriesName>
            <TooltipValue>{t('productCard.avgPriceValue', { price: Number(entry.value).toFixed(2) })}</TooltipValue>
          </TooltipRow>
        )
      })}
    </TooltipCard>
  )
}

function PriceHistoryChart({ data }) {
  const { t } = useTranslation()

  if (data.length === 0) {
    return <EmptyState>{t('analytics.noHistory')}</EmptyState>
  }

  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="stipsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.primaryGreen} stopOpacity={0.25} />
              <stop offset="95%" stopColor={theme.colors.primaryGreen} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="jkpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.jkpBlue} stopOpacity={0.25} />
              <stop offset="95%" stopColor={theme.colors.jkpBlue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={theme.colors.borderLight} strokeDasharray="4 4" />
          <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: theme.colors.chartGuide, strokeWidth: 1.5, strokeDasharray: '2 2' }}
          />
          <Area
            type="monotone"
            dataKey="stipsPrice"
            name={t('analytics.stipsSourceLabel')}
            stroke={theme.colors.primaryGreen}
            strokeWidth={3.5}
            fill="url(#stipsGradient)"
            activeDot={{ r: 6, strokeWidth: 0, fill: theme.colors.primaryGreen }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="jkpPrice"
            name={t('analytics.jkpSourceLabel')}
            stroke={theme.colors.jkpBlue}
            strokeWidth={3.5}
            fill="url(#jkpGradient)"
            activeDot={{ r: 6, strokeWidth: 0, fill: theme.colors.jkpBlue }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrap>
  )
}

export default PriceHistoryChart
