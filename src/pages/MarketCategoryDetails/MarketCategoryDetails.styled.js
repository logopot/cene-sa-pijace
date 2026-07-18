import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 1.5rem 0 1rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    color: ${({ theme }) => theme.colors.primaryGreen};
    text-decoration: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
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
