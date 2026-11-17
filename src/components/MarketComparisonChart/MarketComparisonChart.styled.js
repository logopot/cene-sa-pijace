import styled from 'styled-components'

// Markets with only an old price: quiet lines under the chart, full-contrast text.
export const StaleList = styled.ul`
  list-style: none;
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const StaleItem = styled.li`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`
