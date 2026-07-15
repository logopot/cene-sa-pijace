import { createGlobalStyle } from 'styled-components'
import { theme } from './theme.js'

export const GlobalStyle = createGlobalStyle`
  body, button, input, select, textarea {
    font-family: ${theme.font.body};
  }

  body {
    background-color: ${theme.colors.bg};
    color: ${theme.colors.textDark};
    font-weight: ${theme.font.weight.regular};
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.font.heading};
    font-weight: ${theme.font.weight.bold};
  }

  label,
  .form-label {
    font-weight: ${theme.font.weight.medium};
  }

  hr {
    border-color: ${theme.colors.borderLight};
    opacity: 1;
  }

  .card {
    border-color: ${theme.colors.borderLight};
  }

  .form-control {
    border-color: ${theme.colors.border};

    &:focus {
      border-color: ${theme.colors.primaryGreen};
      box-shadow: 0 0 0 0.2rem ${theme.colors.primaryTint};
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
