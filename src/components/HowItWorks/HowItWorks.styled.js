import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const Section = styled.section`
  background-color: ${({ theme }) => theme.colors.borderLight};
  padding: 2.5rem 0;
  margin-top: 1rem;
`

export const Heading = styled.h2`
  font-size: 1.4rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.primaryGreen};
  text-align: center;
  margin-bottom: 2rem;
`

export const StepCard = styled.div`
  height: 100%;
  text-align: center;
  padding: 0 0.5rem;
`

export const StepIcon = styled(AppIconWrapper)`
  margin: 0 auto ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`

export const StepTitle = styled.h3`
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.4rem;
`

export const StepDescription = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`
