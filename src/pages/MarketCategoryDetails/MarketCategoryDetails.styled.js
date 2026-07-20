import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

// Below 768px, ContextHeading's full sentence (city + category + market)
// routinely wraps to two or three lines, so flex-start keeps the icon
// pinned to the first line instead of drifting toward the whole block's
// vertical middle. Above 768px the same text usually fits on one line, so
// centering reads better there - matches the desktop breakpoint FilterBar
// already switches on (see FilterBar.styled.js's PillBar).
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

// The 4px nudge compensates for ContextHeading's own line-height leading,
// lining the icon's top edge up with the cap-height of its first line
// instead of the taller line box above it - only relevant while PageHeader
// is flex-start (see above); centered alignment needs no such correction.
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

// Single self-describing sentence (city, category, and market all in one
// line) rather than the old split title/subtitle pair - keeps the active
// selection visible in one glance on mobile even once the filter bar itself
// has scrolled out of view (see MarketCategoryDetails.jsx).
export const ContextHeading = styled.h2`
  font-size: 1.35rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: 1.3;
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`
