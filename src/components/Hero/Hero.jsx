import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { MdOutlineUpdate, MdOutlineLocationOn, MdOutlineSavings } from 'react-icons/md'
import {
  StyledHero,
  Headline,
  Subtitle,
  ValueGrid,
  ValueCard,
  ValueIcon,
  ValueTitle,
  ValueDescription,
} from './Hero.styled.js'

const VALUES = [
  { key: 'freshPrices', icon: MdOutlineUpdate, variant: 'primary' },
  { key: 'locationSearch', icon: MdOutlineLocationOn, variant: 'secondary' },
  { key: 'smartSavings', icon: MdOutlineSavings, variant: 'tertiary' },
]

function Hero() {
  const { t } = useTranslation()

  return (
    <StyledHero>
      <Container>
        <Headline>{t('hero.headline')}</Headline>
        <Subtitle>{t('hero.subtitle')}</Subtitle>
        <ValueGrid>
          {VALUES.map(({ key, icon: Icon, variant }) => (
            <ValueCard key={key}>
              <ValueIcon $variant={variant}>
                <Icon />
              </ValueIcon>
              <ValueTitle>{t(`hero.values.${key}.title`)}</ValueTitle>
              <ValueDescription>{t(`hero.values.${key}.description`)}</ValueDescription>
            </ValueCard>
          ))}
        </ValueGrid>
      </Container>
    </StyledHero>
  )
}

export default Hero
