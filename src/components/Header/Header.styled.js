import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'

export const StyledNavbar = styled(Navbar)`
  background-color: var(--color-primary-green);
  padding: 0.75rem 1.5rem;
`

export const BrandLink = styled(Link)`
  display: block;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`

export const Brand = styled(Navbar.Brand)`
  color: var(--color-surface) !important;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: 0.02em;
`

export const Tagline = styled.span`
  display: block;
  color: var(--color-primary-tint);
  font-size: 0.85rem;
  font-weight: 400;
`
