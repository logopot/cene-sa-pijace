import styled from 'styled-components'

// Horizontally scrollable on narrow screens instead of wrapping - a handful
// of variety tabs (Beli/Crveni/Mladi) stay on one line and the row scrolls
// like FilterBar's own MobileFilterDrawer option lists, rather than
// stacking into a taller block above the chart.
export const TabList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  overflow-x: auto;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: 2px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

export const TabButton = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ $isActive, theme }) => ($isActive ? theme.colors.primaryGreen : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.pill};
  background-color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primaryGreen : theme.colors.surface)};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.surface : theme.colors.textSecondary)};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    color: ${({ $isActive, theme }) => ($isActive ? theme.colors.surface : theme.colors.primaryGreen)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryGreen};
    outline-offset: 2px;
  }
`
