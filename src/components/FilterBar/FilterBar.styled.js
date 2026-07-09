import styled from "styled-components";
import { Button } from "react-bootstrap";

export const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
`;

export const FieldLabel = styled.span`
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
`;

export const SubmitButton = styled(Button)`
  background-color: var(--color-primary-green);
  border-color: var(--color-primary-green);
  font-weight: 600;
  width: 100%;

  &:hover,
  &:focus {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  &:disabled,
  &.disabled {
    background-color: var(--color-disabled-bg) !important;
    border-color: var(--color-disabled-bg) !important;
    color: var(--color-text-muted) !important;
    cursor: not-allowed;
    opacity: 0.7;

    &:hover,
    &:focus {
      background-color: var(--color-disabled-bg) !important;
      border-color: var(--color-disabled-bg) !important;
    }
  }
`;
