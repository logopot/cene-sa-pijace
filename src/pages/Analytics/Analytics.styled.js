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

// Title keeps close to its original size on mobile (the left column isn't
// the one squeezing the row - see PriceValue/SourceLabel below, which give
// up the space instead) so product names stay easily readable.
export const ProductTitle = styled.h1`
  font-size: 1.125rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};

  @media (min-width: 768px) {
    font-size: 1.6rem;
  }
`

export const MarketSubtitle = styled.p`
  font-size: 0.75rem;
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

// Deliberately smaller than ProductTitle on mobile (the reverse of desktop's
// hierarchy) - the right column is the one that gives up size so the two
// columns balance in one row instead of the price visually outweighing the
// title it's attached to.
export const PriceValue = styled.span`
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 1.4rem;
  }
`

// Plain text, not a badge - shares MarketSubtitle's typography register
// (muted, smaller than its price) so the price's provenance note reads as
// secondary text, rather than a distinct UI element competing for
// attention. Allowed to wrap (unlike PriceValue) since it's the longest
// string in the header and the column itself may be fairly narrow on mobile.
export const SourceLabel = styled.span`
  font-size: 0.625rem;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;

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
