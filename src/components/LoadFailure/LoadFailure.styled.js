import styled from 'styled-components'

export const Box = styled.div`
  max-width: 520px;
  margin: ${({ theme }) => theme.spacing.xl} auto;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  text-align: center;
`

export const Message = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  font-size: 1.05rem;
  color: ${({ theme }) => theme.colors.textDark};
`

export const ReloadButton = styled.button`
  min-height: 48px;
  padding: 0.65rem 1.75rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primaryGreen};
  color: #fff;
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`
