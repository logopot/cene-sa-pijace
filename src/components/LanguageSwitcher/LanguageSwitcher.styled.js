import styled from 'styled-components'

export const TextSwitcher = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`

export const LangTextButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: lowercase;
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.surface : theme.colors.primaryTint)};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.surface};
  }
`

export const Separator = styled.span`
  color: ${({ theme }) => theme.colors.glassBorder};
  font-size: 0.875rem;
  line-height: 1;
  user-select: none;
`
