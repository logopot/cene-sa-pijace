import styled, { keyframes } from 'styled-components'

const slideUp = keyframes`
  from {
    transform: translateY(16px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

// The collapsed "Započnite pretragu" entry point - only ever visible below
// the desktop breakpoint (PillBar, see FilterBar.styled.js, takes over
// above it).
export const TriggerBar = styled.button`
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;

  @media (max-width: 767px) {
    display: flex;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

// Full-screen mobile overlay - Bar itself is a static block now (see
// FilterBar.styled.js), so this stacks directly against the document root;
// it still sits above everything else on the page (ScrollToTopButton's 999
// is the next-highest) but below nothing at runtime (FullScreenLoader's
// 9999 only ever exists during boot).
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.surface};
  animation: ${slideUp} 0.25s ease;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textDark};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.border};
    outline: none;
  }
`

export const Content = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
`

// Global 24px card radius (theme.radius.xl) on every accordion panel, same
// token ProductCard/MarketCard/CustomDropdown's Menu all share.
export const RowWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`

export const RowHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    transition: transform 0.2s ease;
    transform: rotate(${({ $isExpanded }) => ($isExpanded ? '180deg' : '0deg')});
  }
`

export const RowHeaderText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const RowLabel = styled.span`
  font-size: 0.7rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

export const RowValue = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme, $isPlaceholder }) => ($isPlaceholder ? theme.colors.textMuted : theme.colors.textDark)};
`

// The grid-template-rows 0fr/1fr trick animates to/from an unknown ("auto")
// content height smoothly, which a plain max-height transition can't do
// reliably once the option list's length varies (a handful of categories vs
// dozens of cities/markets).
export const RowPanel = styled.div`
  display: grid;
  grid-template-rows: ${({ $isExpanded }) => ($isExpanded ? '1fr' : '0fr')};
  transition: grid-template-rows 0.25s ease;
`

export const RowPanelInner = styled.div`
  min-height: 0;
  overflow: hidden;
`

export const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 45vh;
  overflow-y: auto;
  padding: 0 ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xs};
`

export const OptionButton = styled.button`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primaryTint : 'transparent')};
  color: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primaryGreen : theme.colors.textDark)};
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: ${({ theme, $isSelected }) =>
    $isSelected ? theme.font.weight.semibold : theme.font.weight.regular};
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.bg};
  }
`

// Sticky search footer (State 2/3, see MobileFilterDrawer.jsx) - only
// rendered once a city is picked, so it never competes with the Grad-only
// first-open view.
export const Footer = styled.div`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  background-color: ${({ theme }) => theme.colors.surface};
`
