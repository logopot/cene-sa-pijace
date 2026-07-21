import styled from "styled-components";
import { Button } from "react-bootstrap";

// Sticks to the viewport top once scrolled to (see FilterBar.jsx's Sentinel
// + IntersectionObserver, which drives $isStuck) - the border/shadow only
// render once actually stuck, so the bar reads as flush with the page while
// inline (below Hero on the homepage, or immediately below Header on every
// other page) and only visually "lifts" off the content once it's pinned.
export const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ $isStuck, theme }) => ($isStuck ? theme.colors.border : "transparent")};
  box-shadow: ${({ $isStuck, theme }) => ($isStuck ? theme.shadow.sm : "none")};
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
`;

// Zero-footprint marker placed immediately before Bar (see FilterBar.jsx) -
// once it scrolls out of the viewport, Bar has necessarily reached its
// sticky top:0 position, which is how $isStuck above is derived.
export const Sentinel = styled.div`
  height: 1px;
`;

// The segmented, pill-shaped unified bar - one continuous rounded container
// housing all three filter segments plus the submit circle, in the style of
// a unified search bar but built entirely from our own tokens (soft shadow,
// not a hard black one; brand green action button, not a copy of any other
// product's palette). Hidden below the desktop breakpoint - MobileFilterDrawer
// (see that component) covers narrow screens instead.
// position: relative + a fixed min-height anchor SubmitCircle's absolute
// placement below - the button floats on top of the last segment rather
// than reserving its own flex slot, so that segment's own hover background
// can extend all the way to the pill's right edge, underneath the button.
export const PillBar = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    width: 100%;
  }

  position: relative;
  min-height: 56px;
  padding: ${({ theme }) => theme.spacing.xxs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

// Thin separator between segments - a hairline rather than a visible border
// on each segment, so three adjacent segments still read as one continuous
// bar (matches PillBar's single outer border/shadow doing all the framing).
export const SegmentDivider = styled.span`
  flex-shrink: 0;
  width: 1px;
  height: 28px;
  background-color: ${({ theme }) => theme.colors.border};
`;

// Submit action, always brand green regardless of the neutral bar around it -
// the one deliberately colored element in the bar, and the only thing that
// visually says "this is our app," not a generic pill-search copy.
// Absolutely positioned (see PillBar) rather than a normal flex sibling, so
// it visually overlaps the Pijaca segment's own hover background instead of
// carving out its own reserved slot - z-index keeps it clickable above that
// segment's trigger. `right: 8px` + `border-radius: 18px` are a deliberately
// concentric pairing with PillBar's own 24px/8px-inset corner (see PillBar) -
// same center point, 6px smaller radius throughout - rather than a circle,
// which reads as visually "louder" than PillBar's now-squared-off curve.
export const SubmitCircle = styled.button`
  position: absolute;
  top: 50%;
  right: ${({ theme }) => theme.spacing.xs};
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.control};
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
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
`;

// Wide green CTA - the desktop stepper's old submit button, now reused as-is
// for MobileFilterDrawer's sticky footer (see that component) since both
// want the same full-width primary action styling.
export const SubmitButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  padding: 0 calc(${({ theme }) => theme.spacing.lg} * 2);
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  border-color: ${({ theme }) => theme.colors.primaryGreen};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:focus {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    border-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled,
  &.disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg} !important;
    border-color: ${({ theme }) => theme.colors.disabledBg} !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
    cursor: not-allowed;
    opacity: 0.7;

    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.colors.disabledBg} !important;
      border-color: ${({ theme }) => theme.colors.disabledBg} !important;
    }
  }
`;
