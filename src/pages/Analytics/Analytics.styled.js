import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`

export const ProductTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`

export const MarketSubtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0.15rem 0 0;
`

// Sits inline to the right of the title block once there's room (desktop);
// below 768px, PageHeader's own flex-wrap drops it onto its own full-width
// line right under the title instead of squeezing beside it. Price and
// source badge stack (not side by side) so the badge always reads as
// "provenance of the price above it," not a separate peer value - right-
// aligned on desktop to match the block's own margin-left: auto push to the
// header's right edge; left-aligned on mobile to match the title's own edge
// once the block drops to its full-width line.
export const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xxs};
  flex-basis: 100%;

  @media (min-width: 768px) {
    flex-basis: auto;
    align-items: flex-end;
    margin-left: auto;
  }
`

export const PriceValue = styled.span`
  font-size: 1.4rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  white-space: nowrap;
`

// Neutral pill, deliberately duller than PriceValue - a data-provenance note,
// not something competing with the price for attention.
export const SourceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
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
