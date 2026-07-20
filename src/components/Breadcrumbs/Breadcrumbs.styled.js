import styled from 'styled-components'
import { Link } from 'react-router-dom'

// Full trail only exists at desktop widths (see FilterBar.styled.js's
// StepField for the same 767px cutoff) - below it, MobileBack takes over so
// a 4-5 segment trail never wraps into a cluttered multi-line block.
export const Nav = styled.nav`
  margin: 1.5rem 0 1rem;

  @media (max-width: 767px) {
    display: none;
  }
`

export const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Item = styled.li`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
`

export const Crumb = styled(Link)`
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.primaryGreen};
    text-decoration: underline;
  }
`

export const CurrentCrumb = styled.span`
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textDark};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
`

export const Separator = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.textMuted};
  opacity: 0.6;
`

// Same pill visual language as the BackLink it replaces (see
// CityDetails.styled.js/MarketDetails.styled.js/MarketCategoryDetails.styled.js/
// Analytics.styled.js - all now delegate to this component instead), but only
// ever shown below the desktop trail's own breakpoint.
export const MobileBack = styled(Link)`
  display: none;

  @media (max-width: 767px) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 100%;
    margin: 1.5rem 0 1rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: ${({ theme }) => theme.font.weight.medium};
    text-decoration: none;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    color: ${({ theme }) => theme.colors.primaryGreen};
    text-decoration: none;
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`

export const MobileBackLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`
