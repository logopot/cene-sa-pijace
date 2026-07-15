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

export const Track = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

export const Slide = styled.div`
  flex-shrink: 0;
  scroll-snap-align: start;
  width: 100%;

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
