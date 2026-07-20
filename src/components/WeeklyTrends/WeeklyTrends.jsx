import { useCallback, useEffect, useRef, useState } from 'react'
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
  Viewport,
  Track,
  Slide,
} from './WeeklyTrends.styled.js'

const SLIDE_GAP_PX = 24
const EDGE_TOLERANCE_PX = 5

function WeeklyTrends({ rows }) {
  const { t } = useTranslation()
  const trackRef = useRef(null)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const { scrollLeft, scrollWidth, clientWidth } = track
    setIsAtStart(scrollLeft <= EDGE_TOLERANCE_PX)
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - EDGE_TOLERANCE_PX)
  }, [])

  // Runs once on mount (and whenever the row set changes) to cover the case
  // where all cards already fit on screen, so both arrows start disabled
  // instead of defaulting to "start" only.
  useEffect(() => {
    handleScroll()
  }, [handleScroll, rows])

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
            <NavButton
              type="button"
              aria-label={t('weeklyTrends.scrollLeft')}
              onClick={() => scrollByDirection(-1)}
              disabled={isAtStart}
            >
              <LuChevronLeft />
            </NavButton>
            <NavButton
              type="button"
              aria-label={t('weeklyTrends.scrollRight')}
              onClick={() => scrollByDirection(1)}
              disabled={isAtEnd}
            >
              <LuChevronRight />
            </NavButton>
          </NavControls>
        </SectionHeader>
        <Viewport>
          <Track ref={trackRef} onScroll={handleScroll}>
            {rows.map((row) => (
              <Slide key={`${row.Mesto}-${row.Proizvod}-${row.Velicina}-${row.Pakovanje}`}>
                <ProductCard row={row} />
              </Slide>
            ))}
          </Track>
        </Viewport>
      </Container>
    </Section>
  )
}

export default WeeklyTrends
