import styled from 'styled-components'

const STATUS_VARIANTS = {
  OPEN: {
    bg: 'var(--color-primary-tint)',
    fg: 'var(--color-primary-green)',
    border: 'var(--color-primary-green)',
    dot: 'var(--color-primary-green)',
  },
  ALWAYS_OPEN: {
    bg: 'var(--color-primary-green)',
    fg: 'var(--color-surface)',
    border: 'var(--color-primary-green)',
    dot: 'var(--color-surface)',
  },
  CLOSED: {
    bg: 'var(--color-border-light)',
    fg: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    dot: 'var(--color-text-muted)',
  },
}

function statusVariant($status) {
  return STATUS_VARIANTS[$status] ?? STATUS_VARIANTS.CLOSED
}

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  border: 1px solid ${({ $status }) => statusVariant($status).border};
  background-color: ${({ $status }) => statusVariant($status).bg};
  color: ${({ $status }) => statusVariant($status).fg};
`

export const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ $status }) => statusVariant($status).dot};
`
