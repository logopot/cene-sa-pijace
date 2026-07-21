import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

// Below 768px, a long CityTitle can wrap to two lines, so flex-start keeps
// the icon pinned to the first line instead of drifting toward the whole
// block's vertical middle - matches MarketCategoryDetails.styled.js's own
// PageHeader (same bug, same fix). Above 768px the title usually fits on one
// line, so centering reads better there.
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    align-items: center;
  }
`

// The 4px nudge lines the icon's top edge up with CityTitle's cap-height
// instead of the taller line box above it - only relevant while PageHeader
// is flex-start; centered alignment needs no such correction.
export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-top: 4px;

  @media (min-width: 768px) {
    margin-top: 0;
  }
`

export const CityTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`

export const MarketTileLink = styled(Link)`
  display: block;
  height: 100%;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: none;
  }
`

export const MarketTileCard = styled(Card)`
  height: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

export const MarketTileName = styled.span`
  font-size: 1.05rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.primaryGreen};
`
