import styled from 'styled-components'

export const StyledHero = styled.section`
  background-color: ${({ theme }) => theme.colors.iconBg};
  padding: ${({ theme }) => theme.spacing.xxl} 0 ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

export const Headline = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: 2.75rem;
  font-weight: ${({ theme }) => theme.font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.titleDark};

  @media (max-width: 767px) {
    font-size: 2rem;
  }
`

export const Subtitle = styled.p`
  max-width: 560px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const ValueGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: left;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }
`

export const ValueCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`

// Maps each value-prop card to a distinct accent pulled from the theme, so
// the three cards read as separate ideas rather than a repeated pattern.
const ICON_VARIANTS = {
  primary: {
    bg: ({ theme }) => theme.colors.primaryTint,
    fg: ({ theme }) => theme.colors.primaryGreen,
  },
  secondary: {
    bg: ({ theme }) => theme.colors.jkpBlueTint,
    fg: ({ theme }) => theme.colors.jkpBlue,
  },
  tertiary: {
    bg: ({ theme }) => theme.colors.tertiaryTint,
    fg: ({ theme }) => theme.colors.tertiary,
  },
}

export const ValueIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${(props) => ICON_VARIANTS[props.$variant].bg(props)};
  color: ${(props) => ICON_VARIANTS[props.$variant].fg(props)};

  svg {
    width: 24px;
    height: 24px;
  }
`

export const ValueTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-size: 1.05rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.titleDark};
`

export const ValueDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`
