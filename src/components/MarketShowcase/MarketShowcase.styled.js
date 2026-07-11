import styled from 'styled-components'

export const Section = styled.section`
  padding: 2.5rem 0;
`

export const Heading = styled.h2`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-bottom: 0.25rem;
`

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 1.5rem;
`
