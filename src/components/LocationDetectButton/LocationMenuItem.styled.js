import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

export const ActionWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.xs};
`

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.primaryGreen};
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.primaryTint};
    outline: none;
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }
`

export const ActionStatus = styled.p`
  margin: 0.25rem 0 0;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  font-size: 0.78rem;
  line-height: 1.3;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const ActionDivider = styled.div`
  height: 1px;
  margin-top: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.borderLight};
`
