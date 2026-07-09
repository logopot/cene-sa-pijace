import styled, { keyframes } from 'styled-components'

const drawStroke = keyframes`
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
`

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
`

// Re-keyed by icon index on every render (see FullScreenLoader.jsx), so
// React remounts a fresh node each time the active fruit/vegetable swaps -
// that's what restarts both the crossfade and the self-drawing stroke
// animation below instead of them only ever playing once.
export const IconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.4s ease;

  svg {
    width: 72px;
    height: 72px;
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    color: ${({ theme }) => theme.colors.primaryGreen};
  }

  svg path,
  svg circle,
  svg line,
  svg polyline,
  svg rect,
  svg ellipse {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: ${drawStroke} 1.1s ease forwards;
  }
`

export const ProgressText = styled.span`
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.font.weight.extrabold};
  color: ${({ theme }) => theme.colors.titleDark};
`

export const PhaseText = styled.p`
  margin: 0;
  min-height: 1.35em;
  font-size: 0.9rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`
