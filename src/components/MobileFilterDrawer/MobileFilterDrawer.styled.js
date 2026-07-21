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

// The collapsed mobile entry point - only ever visible below the desktop
// breakpoint (PillBar, see FilterBar.styled.js, takes over above it). Always
// a neutral white/gray surface (matches PillBar's own resting look) rather
// than a green-tinted "active" state - the search icon circle on the right
// is what signals "this is an interactive search field," not the container's
// color. Right padding is reserved so TriggerLabel's ellipsis truncates
// before it ever reaches TriggerSearchIcon, which is absolutely positioned
// (see below) rather than a normal flex sibling.
export const TriggerBar = styled.button`
  display: none;
  position: relative;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} 52px ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  text-align: left;
  cursor: pointer;

  @media (max-width: 767px) {
    display: flex;
  }
`

// Truncates instead of wrapping/breaking the pill shape once the active
// label (grad - category - pijaca) runs longer than the generic placeholder
// text. $isPlaceholder mirrors RowValue's own convention (muted vs. dark
// text) so the collapsed trigger and the expanded accordion rows read
// consistently.
export const TriggerLabel = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ $isPlaceholder, theme }) => ($isPlaceholder ? theme.colors.textMuted : theme.colors.textDark)};
`

// Decorative search affordance, not a real control - TriggerBar itself is
// the actual interactive element (a <button> can't contain a nested
// <button>), so this is a plain span that visually mirrors FilterBar's own
// SubmitCircle (same brand-green circle + white glass icon) purely to signal
// "tap to search" at a glance. 36px (rather than SubmitCircle's 48px) matches
// the collapsed trigger's smaller overall height.
export const TriggerSearchIcon = styled.span`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.xs};
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  color: ${({ theme }) => theme.colors.surface};

  svg {
    width: 16px;
    height: 16px;
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
