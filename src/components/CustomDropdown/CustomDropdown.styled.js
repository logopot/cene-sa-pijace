import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

export const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  height: 48px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    cursor: not-allowed;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    transition: transform 0.2s ease;
    transform: rotate(${({ $isOpen }) => ($isOpen ? '180deg' : '0deg')});
  }
`

export const TriggerLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme, $isPlaceholder }) => ($isPlaceholder ? theme.colors.textMuted : theme.colors.textDark)};
`

export const Menu = styled.ul`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs};
  list-style: none;
  max-height: 240px;
  overflow-y: auto;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.tooltip};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primaryGreen};
    border-radius: 3px;
  }
`

export const MenuItem = styled.li`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.95rem;
  cursor: pointer;
  color: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primaryGreen : theme.colors.textDark)};
  font-weight: ${({ theme, $isSelected }) =>
    $isSelected ? theme.font.weight.semibold : theme.font.weight.regular};
  background-color: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primaryTint : 'transparent')};

  &:hover {
    background-color: ${({ theme }) => theme.colors.bg};
  }
`
