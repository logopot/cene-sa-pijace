import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

// Two flex items only - TitleGroup (icon + title/subtitle) and PriceBlock
// (price + source) - pinned to opposite edges via space-between on every
// screen size, never wrap onto separate lines/rows (that's the bug this
// layout fixes: a white-card-style stack on mobile). Each side may still
// shrink and let its own text wrap internally; only the two-column row
// itself is fixed.
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 2rem;
`

// The header's left-hand group (icon + title/subtitle) - min-width: 0 lets
// it shrink below its content's natural width so ProductTitle can wrap
// instead of forcing PriceBlock off the row or the row itself to overflow.
export const TitleGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  flex-shrink: 0;
`

// Scaled down below 768px so the title + price columns both fit in one row
// without wrapping - full desktop size once there's room for both side by
// side without cramping.
export const ProductTitle = styled.h1`
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};

  @media (min-width: 768px) {
    font-size: 1.6rem;
  }
`

export const MarketSubtitle = styled.p`
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0.15rem 0 0;

  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`

// The header's right-hand group (price + source) - always right-aligned
// (not just on desktop) so it reads as a clean column against TitleGroup's
// left edge on every screen size. min-width: 0 mirrors TitleGroup so it can
// shrink instead of forcing the row to overflow/wrap.
export const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  text-align: right;
`

export const PriceValue = styled.span`
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 1.4rem;
  }
`

// Plain text, not a badge - shares MarketSubtitle's exact typography (same
// size/color/weight) so the price's provenance note reads as the same
// secondary-text register as the market subtitle above it, rather than a
// distinct UI element competing for attention. Allowed to wrap (unlike
// PriceValue) since it's the longest string in the header and the column
// itself may be fairly narrow on mobile.
export const SourceLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};

  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`

export const Section = styled.section`
  margin-bottom: 2.5rem;
`

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 1rem;
`
