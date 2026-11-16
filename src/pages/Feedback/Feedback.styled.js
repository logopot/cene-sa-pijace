import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const Page = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.lg} 0 ${({ theme }) => theme.spacing.xl};
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`

export const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};

  @media (min-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textDark};
`

// 16px text and a 48px minimum height: big enough to tap, and mobile Safari
// does not zoom into the field on focus.
const controlStyles = `
  width: 100%;
  min-height: 48px;
  padding: 0.65rem 0.85rem;
  font-size: 1rem;
  line-height: 1.4;
`

export const Input = styled.input`
  ${controlStyles}
  border: 1px solid ${({ $invalid, theme }) => ($invalid ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textDark};
  background: ${({ theme }) => theme.colors.surface};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryGreen};
    outline-offset: 1px;
  }
`

export const Textarea = styled.textarea`
  ${controlStyles}
  min-height: 160px;
  resize: vertical;
  font-family: inherit;
  border: 1px solid ${({ $invalid, theme }) => ($invalid ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textDark};
  background: ${({ theme }) => theme.colors.surface};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primaryGreen};
    outline-offset: 1px;
  }
`

// Helper text on the left, character counter on the right.
export const FieldMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Hint = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Counter = styled.span`
  margin-left: auto;
  font-size: 0.85rem;
  color: ${({ $over, theme }) => ($over ? theme.colors.danger : theme.colors.textMuted)};
`

export const FieldError = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.danger};
`

// Off-screen rather than display:none, so a bot that fills "every input" still
// meets it; people (and screen readers, via aria-hidden) never do.
export const Honeypot = styled.div`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

// Holds the Turnstile widget. It has no height of its own: empty (nothing
// started) it takes no room at all, and when Cloudflare shows something - the
// "Success!" tick or a "Confirm you are human" box - it simply grows. The page
// declares "color-scheme: light dark" (index.css); an iframe inherits it and the
// widget would get a dark backdrop in a dark OS theme, so it is pinned to light,
// together with the widget's own fixed light theme.
export const TurnstileSlot = styled.div`
  color-scheme: light;
  max-width: 100%;
  overflow-x: auto;
`

export const WidgetArea = styled.div`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`

export const VerifyNote = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const RetryButton = styled.button`
  align-self: flex-start;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

export const FormError = styled.div`
  min-height: 0;
  padding: ${({ $visible, theme }) => ($visible ? theme.spacing.sm : 0)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $visible, theme }) => ($visible ? theme.colors.dangerTint : 'transparent')};
  color: ${({ theme }) => theme.colors.danger};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

export const SubmitButton = styled.button`
  width: 100%;
  min-height: 48px;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primaryGreen};
  color: #fff;
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;
  transition: background 0.2s ease-in-out;

  &:hover:not(:disabled),
  &:focus-visible {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disabledBg};
    cursor: not-allowed;
  }

  @media (min-width: 768px) {
    width: auto;
    align-self: flex-start;
  }
`

export const Success = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primaryTintSoft};
  border: 1px solid ${({ theme }) => theme.colors.primaryTint};
  border-radius: ${({ theme }) => theme.radius.lg};

  &:focus {
    outline: none;
  }
`

export const SuccessTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-size: 1.3rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.primaryGreen};
`

export const SuccessText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`

// Under the heading, above the form: plain grey text, no frame.
export const Notes = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

export const Note = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textMuted};
`
