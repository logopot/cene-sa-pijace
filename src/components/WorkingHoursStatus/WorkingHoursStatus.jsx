import { useTranslation } from 'react-i18next'
import { getMarketStatus, formatClosingTime, MARKET_STATUS } from '../../utils/marketTime.js'
import { Row, Label, Value, Dot } from './WorkingHoursStatus.styled.js'

// Divider row used at the bottom of market cards (MarketCard, CityDetails'
// MarketTileCard) - distinct from MarketStatusBadge, which stays a pill next
// to a page title on the detail pages.
function WorkingHoursStatus({ grad, pijaca }) {
  const { t } = useTranslation()
  const { status, slot } = getMarketStatus(grad, pijaca)

  if (status === MARKET_STATUS.UNKNOWN) return null

  const hoursText =
    status === MARKET_STATUS.ALWAYS_OPEN ? t('marketStatus.cardAlwaysOpen')
    : status === MARKET_STATUS.OPEN ? t('marketStatus.cardOpenUntil', { time: formatClosingTime(slot.close) })
    : t('marketStatus.cardClosed')

  const isOpen = status === MARKET_STATUS.OPEN || status === MARKET_STATUS.ALWAYS_OPEN

  return (
    <Row>
      <Label>{t('marketStatus.cardLabel')}</Label>
      <Value>
        <Dot $isOpen={isOpen} />
        {hoursText}
      </Value>
    </Row>
  )
}

export default WorkingHoursStatus
