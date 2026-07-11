import styled from 'styled-components'

function getStatusVariants(theme) {
  return {
    OPEN: {
      bg: theme.colors.primaryTint,
      fg: theme.colors.primaryGreen,
      border: theme.colors.primaryGreen,
      dot: theme.colors.primaryGreen,
    },
    ALWAYS_OPEN: {
      bg: theme.colors.primaryGreen,
      fg: theme.colors.surface,
      border: theme.colors.primaryGreen,
      dot: theme.colors.surface,
    },
    CLOSED: {
      bg: theme.colors.borderLight,
      fg: theme.colors.textSecondary,
      border: theme.colors.border,
      dot: theme.colors.textMuted,
    },
  }
}

function statusVariant($status, theme) {
  const variants = getStatusVariants(theme)
  return variants[$status] ?? variants.CLOSED
}

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  border: 1px solid ${({ $status, theme }) => statusVariant($status, theme).border};
  background-color: ${({ $status, theme }) => statusVariant($status, theme).bg};
  color: ${({ $status, theme }) => statusVariant($status, theme).fg};
`

export const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ $status, theme }) => statusVariant($status, theme).dot};
`
