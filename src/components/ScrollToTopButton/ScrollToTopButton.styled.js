import styled from 'styled-components'

export const FloatingButton = styled.button`
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 12px;
  border: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.cardHover};
  color: ${({ theme }) => theme.colors.primaryGreen};
  cursor: pointer;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transform: ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(12px)')};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    transform: ${({ $visible }) => ($visible ? 'translateY(0) scale(1.08)' : 'translateY(12px)')};
  }
`
