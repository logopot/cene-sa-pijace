import styled from 'styled-components'

// The hover logic listens on this wrapper (not on any element inside the chart), and
// the chart's own shapes never take pointer events, so what is under the cursor can
// never matter. A finger may drag over the chart to read it while the page still
// scrolls vertically.
export const ChartWrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  touch-action: pan-y;

  .recharts-area,
  .recharts-area-area,
  .recharts-area-curve,
  .recharts-curve,
  .recharts-area-dots,
  .recharts-area-dot,
  .recharts-dot {
    pointer-events: none;
  }
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

// Holds the tooltip card inside the chart (in an SVG foreignObject, positioned with
// attributes - no inline styles): the card sits at the left of the slot, or at its
// right edge when it has been flipped to the left of the pointer.
export const TooltipSlot = styled.div`
  display: flex;
  justify-content: ${({ $alignEnd }) => ($alignEnd ? 'flex-end' : 'flex-start')};
  pointer-events: none;
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
