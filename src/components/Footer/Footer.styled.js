import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const StyledFooter = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
  padding: 1.25rem 1.5rem;
  margin-top: 2rem;
`

export const FooterInner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`

export const Copyright = styled.span`
  color: var(--color-text-muted);
  font-size: 0.85rem;
`

export const DisclaimerLink = styled(Link)`
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-decoration: underline;

  &:hover {
    color: var(--color-primary-green);
  }
`

export const StipsLink = styled.a`
  color: var(--color-text-muted);
  font-weight: 600;
  text-decoration: underline;

  &:hover {
    color: var(--color-primary-green);
  }
`
