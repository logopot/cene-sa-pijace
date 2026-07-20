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
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

// ContextHeading can wrap to two or three lines (city + category + market in
// one sentence), so PageHeader aligns to flex-start rather than center - a
// tall multi-line heading would otherwise pull the icon down toward its own
// vertical middle instead of its first line. The 4px nudge compensates for
// the heading's own line-height leading, lining the icon's top edge up with
// the cap-height of that first line instead of the taller line box above it.
export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-top: 4px;
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
