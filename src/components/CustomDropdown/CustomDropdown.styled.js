import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
  width: 100%;
  /* Only takes effect inside a flex parent (e.g. FilterBar's city FieldRow,
     which pairs this with LocationDetectButton) - harmless everywhere else,
     since Bootstrap's Col (this component's usual parent) isn't display:flex. */
  flex: 1;
  min-width: 0;
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

// Chrome-only wrapper: owns the border-radius/border/shadow and clips its
// scrollable child so the child's scrollbar can never bleed past the rounded
// corners (a plain overflow-y:auto element with its own border-radius won't
// reliably clip a webkit scrollbar to that radius).
export const Menu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 10;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.tooltip};
  overflow: hidden;
`

export const MenuList = styled.ul`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs};
  padding-right: calc(${({ theme }) => theme.spacing.xs} + 6px);
  list-style: none;
  max-height: 240px;
  overflow-y: auto;

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

// Desktop segmented-bar trigger (see FilterBar.jsx's PillBar) - a bare,
// borderless cell instead of Trigger's own standalone pill, since the outer
// PillBar already supplies the border/shadow/rounding for all three segments
// at once. Shares every open/close/keyboard behavior with Trigger; only the
// visual shell differs.
//
// The hover/open highlight's own corners follow $position so they read as
// part of PillBar's single continuous curve rather than three independent
// rounded rectangles: the first segment only rounds its left corners, the
// last only its right, and the middle segment stays perfectly square.
const SEGMENT_HIGHLIGHT_RADIUS = {
  first: ({ theme }) => `${theme.radius.pill} 0 0 ${theme.radius.pill}`,
  middle: () => '0',
  last: ({ theme }) => `0 ${theme.radius.pill} ${theme.radius.pill} 0`,
}

export const SegmentTrigger = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 100%;
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: ${(props) => (SEGMENT_HIGHLIGHT_RADIUS[props.$position] ?? SEGMENT_HIGHLIGHT_RADIUS.middle)(props)};
  background-color: ${({ $isOpen, theme }) => ($isOpen ? theme.colors.borderLight : 'transparent')};
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`

export const SegmentLabel = styled.span`
  font-size: 0.7rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

export const SegmentValue = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme, $isPlaceholder }) => ($isPlaceholder ? theme.colors.textMuted : theme.colors.textDark)};
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

  &:hover,
  &:focus,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.bg};
    outline: none;
  }
`
