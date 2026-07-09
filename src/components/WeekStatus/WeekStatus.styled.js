import styled from 'styled-components'

export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $archived }) => ($archived ? 'var(--color-border)' : 'var(--color-primary-tint)')};
  border-left: 3px solid ${({ $archived }) => ($archived ? 'var(--color-text-secondary)' : 'var(--color-primary-green)')};
  border-radius: 4px;
  background-color: ${({ $archived }) => ($archived ? 'var(--color-border-light)' : 'var(--color-icon-bg)')};
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.01em;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: ${({ $archived }) => ($archived ? 'var(--color-text-muted)' : 'var(--color-primary-green)')};
  }
`
