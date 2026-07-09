import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { LuMapPinned, LuRefreshCw, LuShieldCheck } from 'react-icons/lu'
import {
  StyledHero,
  Subtitle,
  StatsRow,
  StatCard,
  StatIcon,
  StatText,
  StatTitle,
  StatDescription,
} from './Hero.styled.js'

const STATS = [
  { key: 'official', icon: LuShieldCheck },
  { key: 'coverage', icon: LuMapPinned },
  { key: 'freshness', icon: LuRefreshCw },
]

function Hero() {
  const { t } = useTranslation()

  return (
    <StyledHero>
      <Container>
        <Subtitle>{t('header.tagline')}</Subtitle>
        <StatsRow>
          {STATS.map(({ key, icon: Icon }) => (
            <StatCard key={key}>
              <StatIcon>
                <Icon />
              </StatIcon>
              <StatText>
                <StatTitle>{t(`hero.stats.${key}.title`)}</StatTitle>
                <StatDescription>{t(`hero.stats.${key}.description`)}</StatDescription>
              </StatText>
            </StatCard>
          ))}
        </StatsRow>
      </Container>
    </StyledHero>
  )
}

export default Hero
