import { createGlobalStyle } from 'styled-components'
import { theme } from './theme.js'

// :root custom properties are generated from theme.js's values (not
// hand-duplicated) so components still on var(--...) and components using
// the ThemeProvider's theme.foo interpolation never drift apart.
export const GlobalStyle = createGlobalStyle`
  :root {
    --color-primary-green: ${theme.colors.primaryGreen};
    --color-primary-hover: ${theme.colors.primaryHover};
    --color-primary-tint: ${theme.colors.primaryTint};
    --color-icon-bg: ${theme.colors.iconBg};
    --color-disabled-bg: ${theme.colors.disabledBg};
    --color-surface: ${theme.colors.surface};
    --color-bg: ${theme.colors.bg};
    --color-text-dark: ${theme.colors.textDark};
    --color-text-secondary: ${theme.colors.textSecondary};
    --color-text-muted: ${theme.colors.textMuted};
    --color-border: ${theme.colors.border};
    --color-border-light: ${theme.colors.borderLight};
    --color-danger: ${theme.colors.danger};
    --color-danger-tint: ${theme.colors.dangerTint};
    --color-jkp-blue: ${theme.colors.jkpBlue};
    --color-chart-guide: ${theme.colors.chartGuide};
    --radius-lg: ${theme.radius.lg};
    --font-family-base: ${theme.font.family};
    --shadow-card: ${theme.shadow.card};
    --shadow-card-hover: ${theme.shadow.cardHover};
    --shadow-tooltip: ${theme.shadow.tooltip};
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text-dark);
    font-family: var(--font-family-base);
    font-weight: ${theme.font.weight.regular};
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.font.weight.bold};
  }

  label,
  .form-label {
    font-weight: ${theme.font.weight.medium};
  }

  hr {
    border-color: var(--color-border-light);
    opacity: 1;
  }

  .card {
    border-color: var(--color-border-light);
  }

  .form-control {
    border-color: var(--color-border);

    &:focus {
      border-color: var(--color-primary-green);
      box-shadow: 0 0 0 0.2rem var(--color-primary-tint);
    }
  }

  .form-select {
    height: 48px;
    border-radius: ${theme.radius.xl};
    border: 1px solid ${theme.colors.border};
    background-color: ${theme.colors.surface};
    transition: border-color 0.2s ease;

    &:hover {
      border-color: ${theme.colors.primaryGreen};
    }

    &:focus {
      border-color: ${theme.colors.primaryGreen};
      box-shadow: 0 0 0 0.2rem ${theme.colors.primaryTint};
    }
  }
`
