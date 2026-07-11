import styled from 'styled-components'

export const ChartWrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
`

export const EmptyState = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

export const Leaderboard = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`

export const LeaderCard = styled.div`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $variant, theme }) => ($variant === 'cheapest' ? theme.colors.primaryTint : theme.colors.borderLight)};
`

export const LeaderLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const LeaderValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin-top: 0.15rem;
`
