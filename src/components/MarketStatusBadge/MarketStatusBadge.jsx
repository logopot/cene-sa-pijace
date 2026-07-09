import { useTranslation } from 'react-i18next'
import { getMarketStatus, formatTodayHours, MARKET_STATUS } from '../../utils/marketTime.js'
import { Badge, Dot } from './MarketStatusBadge.styled.js'

function MarketStatusBadge({ grad, pijaca }) {
  const { t } = useTranslation()
  const { status, info, slot } = getMarketStatus(grad, pijaca)

  if (status === MARKET_STATUS.UNKNOWN) return null

  const label =
    status === MARKET_STATUS.ALWAYS_OPEN
      ? t('marketStatus.alwaysOpen')
      : status === MARKET_STATUS.CLOSED
        ? t('marketStatus.closed')
        : t('marketStatus.openUntil', { time: slot.close })

  const hours = status === MARKET_STATUS.CLOSED ? t('marketStatus.closedToday') : formatTodayHours(slot)

  return (
    <Badge $status={status} title={t('marketStatus.tooltip', { address: info.address, hours })}>
      <Dot $status={status} />
      {label}
    </Badge>
  )
}

export default MarketStatusBadge
