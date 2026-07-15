import { useTranslation } from 'react-i18next'
import { LuStore } from 'react-icons/lu'
import { Card } from 'react-bootstrap'
import { getMarketStatus, formatClosingTime, MARKET_STATUS } from '../../utils/marketTime.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { buildCityRoute } from '../../utils/market.js'
import {
  CardLink,
  StyledCard,
  IconWrap,
  CityName,
  MarketName,
  WorkingHoursRow,
  WorkingHoursLabel,
  WorkingHoursValue,
  StatusDot,
} from './MarketCard.styled.js'

function MarketCard({ grad, pijaca }) {
  const { t, i18n } = useTranslation()
  const { status, slot } = getMarketStatus(grad, pijaca)

  const hoursText =
    status === MARKET_STATUS.ALWAYS_OPEN ? t('marketStatus.cardAlwaysOpen')
    : status === MARKET_STATUS.OPEN ? t('marketStatus.cardOpenUntil', { time: formatClosingTime(slot.close) })
    : t('marketStatus.cardClosed')

  const isOpen = status === MARKET_STATUS.OPEN || status === MARKET_STATUS.ALWAYS_OPEN

  return (
    <CardLink to={buildCityRoute(grad, i18n.language)}>
      <StyledCard>
        <Card.Body>
          <IconWrap>
            <LuStore />
          </IconWrap>
          <CityName>{translateDataValue(t, 'grad', grad)}</CityName>
          <MarketName>{translateDataValue(t, 'pijaca', pijaca)}</MarketName>
          {status !== MARKET_STATUS.UNKNOWN && (
            <WorkingHoursRow>
              <WorkingHoursLabel>{t('marketStatus.cardLabel')}</WorkingHoursLabel>
              <WorkingHoursValue>
                <StatusDot $isOpen={isOpen} />
                {hoursText}
              </WorkingHoursValue>
            </WorkingHoursRow>
          )}
        </Card.Body>
      </StyledCard>
    </CardLink>
  )
}

export default MarketCard
