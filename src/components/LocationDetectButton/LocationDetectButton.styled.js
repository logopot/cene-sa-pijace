import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

export const Wrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`

export const DetectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primaryGreen};
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    background-color: ${({ theme }) => theme.colors.primaryTint};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  .spin {
    animation: ${spin} 0.8s linear infinite;
  }
`

export const StatusMessage = styled.p`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 10;
  width: max-content;
  max-width: 220px;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.tooltip};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8rem;
  line-height: 1.3;
`
