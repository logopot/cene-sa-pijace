import styled from 'styled-components'

export const LogoSvg = styled.svg`
  flex-shrink: 0;
`

export const LogoSquare = styled.rect`
  fill: ${({ theme, $isHeaderVersion }) =>
    $isHeaderVersion ? theme.colors.surface : theme.colors.primaryGreen};
`

export const LogoDot = styled.circle`
  fill: ${({ theme, $isHeaderVersion }) =>
    $isHeaderVersion ? theme.colors.primaryGreen : theme.colors.surface};
`

export const LogoLeaf = styled.path`
  fill: ${({ theme }) => theme.colors.leafOrange};
`
