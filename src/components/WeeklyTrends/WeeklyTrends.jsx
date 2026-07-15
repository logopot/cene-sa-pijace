import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import ProductCard from '../ProductCard/ProductCard.jsx'
import {
  Section,
  SectionHeader,
  HeaderText,
  Heading,
  Subtitle,
  NavControls,
  NavButton,
  Track,
  Slide,
} from './WeeklyTrends.styled.js'

const SLIDE_GAP_PX = 24

function WeeklyTrends({ rows }) {
  const { t } = useTranslation()
  const trackRef = useRef(null)

  if (rows.length === 0) return null

  const scrollByDirection = (direction) => {
    const track = trackRef.current
    if (!track) return
    const cardWidth = track.firstElementChild?.getBoundingClientRect().width ?? 0
    track.scrollBy({ left: direction * (cardWidth + SLIDE_GAP_PX), behavior: 'smooth' })
  }

  return (
    <Section>
      <Container>
        <SectionHeader>
          <HeaderText>
            <Heading>{t('weeklyTrends.title')}</Heading>
            <Subtitle>{t('weeklyTrends.subtitle')}</Subtitle>
          </HeaderText>
          <NavControls>
            <NavButton type="button" aria-label={t('weeklyTrends.scrollLeft')} onClick={() => scrollByDirection(-1)}>
              <LuChevronLeft />
            </NavButton>
            <NavButton type="button" aria-label={t('weeklyTrends.scrollRight')} onClick={() => scrollByDirection(1)}>
              <LuChevronRight />
            </NavButton>
          </NavControls>
        </SectionHeader>
        <Track ref={trackRef}>
          {rows.map((row) => (
            <Slide key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}`}>
              <ProductCard row={row} />
            </Slide>
          ))}
        </Track>
      </Container>
    </Section>
  )
}

export default WeeklyTrends
