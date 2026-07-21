import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

// Below 768px, a long MarketTitle can wrap to two lines, so flex-start keeps
// the icon pinned to the first line instead of drifting toward the whole
// block's vertical middle - matches MarketCategoryDetails.styled.js's own
// PageHeader (same bug, same fix). Above 768px the title usually fits on one
// line, so centering reads better there.
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    align-items: center;
  }
`

// The 4px nudge lines the icon's top edge up with MarketTitle's cap-height
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

export const TitleGroup = styled.div`
  flex: 1;
  min-width: 0;
`

export const MarketTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`

export const CityLabel = styled.span`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
