import { useTranslation } from 'react-i18next'
import { LuStore } from 'react-icons/lu'
import { Card } from 'react-bootstrap'
import WorkingHoursStatus from '../WorkingHoursStatus/WorkingHoursStatus.jsx'
import { translateDataValue } from '../../utils/translateValue.js'
import { buildCityRoute } from '../../utils/market.js'
import { CardLink, StyledCard, IconWrap, CityName, MarketName } from './MarketCard.styled.js'

function MarketCard({ grad, pijaca }) {
  const { t, i18n } = useTranslation()

  return (
    <CardLink to={buildCityRoute(grad, i18n.language)}>
      <StyledCard>
        <Card.Body>
          <IconWrap>
            <LuStore />
          </IconWrap>
          <CityName>{translateDataValue(t, 'grad', grad)}</CityName>
          <MarketName>{translateDataValue(t, 'pijaca', pijaca)}</MarketName>
          <WorkingHoursStatus grad={grad} pijaca={pijaca} />
        </Card.Body>
      </StyledCard>
    </CardLink>
  )
}

export default MarketCard
