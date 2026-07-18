import styled from "styled-components";
import { Button, Col } from "react-bootstrap";

export const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} 0;
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const FieldLabel = styled.span`
  display: block;
  font-size: 0.8rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`;

// Lets a field's dropdown share its row with an adjacent action button (e.g.
// the city step's LocationDetectButton) without widening the Bootstrap col.
export const FieldRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${({ theme }) => theme.spacing.xs};
`;

// Only steps matching the mobile stepper's current step stay visible below
// the desktop breakpoint - above it, Bootstrap's own col-md-* classes take
// over and every field renders side by side as before.
export const StepField = styled(Col)`
  @media (max-width: 767px) {
    display: ${({ $active }) => ($active ? "block" : "none")};
  }
`;

// Hidden entirely at desktop widths since the stepper (progress text + back
// navigation + instruction line) only exists to compensate for mobile
// showing one field at a time.
export const MobileStepHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  @media (min-width: 768px) {
    display: none;
  }
`;

export const StepHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const StepIndicator = styled.span`
  font-size: 0.8rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const StepInstruction = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.primaryGreen};
  cursor: pointer;
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  transition: background-color 0.2s ease, color 0.2s ease;

  svg {
    color: ${({ theme }) => theme.colors.primaryGreen};
    transition: color 0.2s ease;
  }

  &:hover,
  &:focus {
    color: ${({ theme }) => theme.colors.primaryHover};
    background-color: ${({ theme }) => theme.colors.primaryTint};

    svg {
      color: ${({ theme }) => theme.colors.primaryHover};
    }
  }
`;

export const SubmitButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  padding: 0 calc(${({ theme }) => theme.spacing.lg} * 2);
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  border-color: ${({ theme }) => theme.colors.primaryGreen};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover,
  &:focus {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    border-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled,
  &.disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg} !important;
    border-color: ${({ theme }) => theme.colors.disabledBg} !important;
    color: ${({ theme }) => theme.colors.textMuted} !important;
    cursor: not-allowed;
    opacity: 0.7;

    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.colors.disabledBg} !important;
      border-color: ${({ theme }) => theme.colors.disabledBg} !important;
    }
  }
`;
