import styled from 'styled-components'

// One neutral, subtle container regardless of source/freshness - only the
// icon's color varies (see WeekStatus.jsx), so the badge itself never reads
// as a colored "alert" state.
export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
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

  strong {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${({ $archived, theme }) => ($archived ? theme.colors.textMuted : theme.colors.primaryGreen)};
  }
`
