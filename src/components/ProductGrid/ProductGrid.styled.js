import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const Section = styled.section`
  padding: 1.5rem 0 2.5rem;
`

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 30vh;
  padding: 2.5rem 1rem;
  text-align: center;
`

export const EmptyIcon = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0.5rem;

  svg {
    width: 40px;
    height: 40px;
  }
`

export const EmptyTitle = styled.p`
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.titleDark};
  margin: 0;
`

export const EmptyDescription = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 420px;
  margin: 0 0 1rem;
`

export const EmptyAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  color: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.heading};
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-decoration: none;
  padding: 0.75rem 1.75rem;
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.xs};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.surface};
  }
`
