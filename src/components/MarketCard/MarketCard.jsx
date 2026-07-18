import { useTranslation } from 'react-i18next'
import { LuStore } from 'react-icons/lu'
import { Card } from 'react-bootstrap'
import { translateDataValue } from '../../utils/translateValue.js'
import { buildCityRoute } from '../../utils/market.js'
import { CardLink, StyledCard, CardHeader, IconWrap, TitleWrap, CityName, MarketName } from './MarketCard.styled.js'

function MarketCard({ grad, pijaca }) {
  const { t, i18n } = useTranslation()

  return (
    <CardLink to={buildCityRoute(grad, i18n.language)}>
      <StyledCard>
        <Card.Body>
          <CardHeader>
            <IconWrap>
              <LuStore />
            </IconWrap>
            <TitleWrap>
              <CityName>{translateDataValue(t, 'grad', grad)}</CityName>
              <MarketName>{translateDataValue(t, 'pijaca', pijaca)}</MarketName>
            </TitleWrap>
          </CardHeader>
        </Card.Body>
      </StyledCard>
    </CardLink>
  )
}

export default MarketCard
