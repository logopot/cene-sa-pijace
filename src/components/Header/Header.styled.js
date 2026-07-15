import styled from "styled-components";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";

export const StyledNavbar = styled(Navbar)`
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  padding: 0.75rem;
`;

export const BrandLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

export const Brand = styled(Navbar.Brand)`
  color: ${({ theme }) => theme.colors.surface} !important;
  font-weight: 700;
  font-size: 1.3rem;
  letter-spacing: 0.02em;
  margin: 5px 0 0 0;
`;
