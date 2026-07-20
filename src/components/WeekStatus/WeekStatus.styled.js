import styled from 'styled-components'

// One neutral container regardless of source/freshness - the checkmark icon
// is always the same shape and color (see WeekStatus.jsx), so the badge
// never reads as a degraded/alert state.
export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.01em;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    /* Nudges the icon down from the row's flex-start edge to sit level with
       the source name's cap height instead of its full line box - matters
       once TextGroup wraps to two lines below 576px and the icon would
       otherwise float noticeably above the first line of text. */
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

// Source name and date metadata sit side by side at desktop widths; below
// 576px they stack (source name stays on the icon's line, the localized
// date range gets its own line below) so a long range never squeezes/wraps
// against the source name mid-word on narrow screens.
export const TextGroup = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.xxs};
  }
`

export const SourceName = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
`

export const DateMeta = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`
