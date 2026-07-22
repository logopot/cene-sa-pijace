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

export const Note = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  font-size: 0.85rem;
  margin: 0.75rem 0 0;
`

export const TooltipCard = styled.div`
  min-width: 160px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadow.tooltip};
  padding: 0.75rem 1rem;
`

export const TooltipDate = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0.5rem;
`

export const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  & + & {
    margin-top: 0.3rem;
  }
`

export const TooltipDot = styled.span`
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

export const TooltipSeriesName = styled.span`
  flex: 1;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const TooltipValue = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
`
