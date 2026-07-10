import styled from 'styled-components'

// Shared base for every card container across the app - each component's
// .styled.js extends this via styled(AppCard) and layers on only its own
// background/border/shadow/hover, so radius and padding stay identical
// everywhere instead of being redeclared per file.
export const AppCard = styled.div`
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
`

// Shared base for every icon badge inside a card - fixed 48x48 box, 12px
// corners, centered glyph. Each consumer only supplies background/color.
export const AppIconWrapper = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
`
