import styled from 'styled-components'

export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $archived, theme }) => ($archived ? theme.colors.border : theme.colors.primaryTint)};
  border-left: 3px solid ${({ $archived, theme }) => ($archived ? theme.colors.textSecondary : theme.colors.primaryGreen)};
  border-radius: 4px;
  background-color: ${({ $archived, theme }) => ($archived ? theme.colors.borderLight : theme.colors.iconBg)};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.01em;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${({ $archived, theme }) => ($archived ? theme.colors.textMuted : theme.colors.primaryGreen)};
  }
`
