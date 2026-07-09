import styled from 'styled-components'

export const StyledHero = styled.section`
  background-color: var(--color-icon-bg);
  padding: 2.5rem 0 2rem;
  text-align: center;
`

export const Subtitle = styled.p`
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0 0 1.75rem;
`

export const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
`

export const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  flex: 1 1 260px;
  max-width: 320px;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
`

export const StatIcon = styled.div`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: var(--color-primary-tint);
  color: var(--color-primary-green);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
  }
`

export const StatText = styled.div`
  min-width: 0;
`

export const StatTitle = styled.div`
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-text-dark);
`

export const StatDescription = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.1rem;
`
