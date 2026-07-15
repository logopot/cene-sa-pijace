import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Navbar } from 'react-bootstrap'

export const StyledNavbar = styled(Navbar)`
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  padding: 0.75rem 1.5rem;
`

export const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`

export const BrandText = styled.div`
  display: flex;
  flex-direction: column;
`

export const Brand = styled(Navbar.Brand)`
  color: ${({ theme }) => theme.colors.surface} !important;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: 0.02em;
  margin-right: 0;
`

export const Tagline = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.primaryTint};
  font-size: 0.85rem;
  font-weight: 400;
`
