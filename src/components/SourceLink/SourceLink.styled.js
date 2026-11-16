import styled from 'styled-components'

export const Anchor = styled.a`
  color: inherit;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`
