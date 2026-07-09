import styled from 'styled-components'

export const ChartWrap = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
`

export const EmptyState = styled.p`
  color: var(--color-text-muted);
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
  border: 1px solid var(--color-border);
  background: ${({ $variant }) => ($variant === 'cheapest' ? 'var(--color-primary-tint)' : 'var(--color-border-light)')};
`

export const LeaderLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
`

export const LeaderValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin-top: 0.15rem;
`
