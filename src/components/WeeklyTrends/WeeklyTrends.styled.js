import styled from 'styled-components'

export const Section = styled.section`
  padding: 1.5rem 0;
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: 1.25rem;
`

export const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`

export const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-bottom: 0.25rem;
`

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0;
`

export const NavControls = styled.div`
  display: none;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (min-width: 576px) {
    display: flex;
  }
`

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primaryGreen};
  font-size: 1.1rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryTint};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryGreen};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
  }
`

// Wraps Track with a hard, non-scrolling clip boundary. Track (the actual
// scroll container, see below) already clips its own overflow, but its
// left/right padding - added purely so hover shadows have room to paint,
// see Track's own comment - was equal to the gap between slides, so the
// clip boundary landed exactly on the next card's edge with nothing to stop
// *that* card's own resting shadow from bleeding leftward into the same
// space. Viewport is the outer, unpadded backstop: even if Track's own
// clipping ever slipped, nothing outside this box is paintable.
export const Viewport = styled.div`
  overflow: hidden;
`

export const Track = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  /* overflow-x:auto forces the browser to clip the y-axis too (an element
     can't scroll on one axis while staying visible on the other), which was
     cropping ProductCard's resting box-shadow at the track's edges. Can't
     drop overflow-x - that's what makes this a scrollable carousel - so the
     padding below gives it room instead. Sized to spacing.xs (8px), well
     under the 1.5rem (24px) gap between slides: card N's own shadow reaches
     roughly 8px past its edge at rest, so this fully contains it while
     leaving the rest of the gap as a true dead zone the next card's own
     shadow can't bleed backward into (see Viewport above for the belt-and-
     braces outer clip). Hover's larger shadow can lose a few px off its
     softest, most transparent edge here - an acceptable trade for never
     revealing the next card. */
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.xl}
    ${({ theme }) => theme.spacing.xs};
  scroll-padding-left: ${({ theme }) => theme.spacing.xs};
  scroll-padding-right: ${({ theme }) => theme.spacing.xs};

  &::-webkit-scrollbar {
    display: none;
  }
`

export const Slide = styled.div`
  flex-shrink: 0;
  scroll-snap-align: start;
  /* Leaves 48px of the next card peeking in on mobile, signaling the track
     is swipeable instead of reading as a single full-bleed card. */
  width: calc(100% - 48px);

  @media (min-width: 576px) {
    width: calc((100% - 1.5rem) / 2);
  }

  @media (min-width: 992px) {
    width: calc((100% - 3rem) / 3);
  }

  @media (min-width: 1200px) {
    width: calc((100% - 4.5rem) / 4);
  }
`
