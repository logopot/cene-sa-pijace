import styled, { css } from "styled-components";
import { Link } from "react-router-dom";

export const StyledFooter = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

export const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 4rem;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

export const BrandColumn = styled.div`
  flex: 0 1 45%;
`;

export const BrandRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const BrandTitle = styled.span`
  font-family: ${({ theme }) => theme.font.heading};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.titleDark};
`;

export const Tagline = styled.p`
  max-width: 380px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  line-height: 1.6;
`;

export const NavArea = styled.div`
  display: flex;
  gap: 4rem;

  @media (max-width: 767px) {
    gap: 2rem;
  }
`;

export const NavColumn = styled.div``;

export const NavHeading = styled.h3`
  font-size: 0.8rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const linkStyles = css`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  padding-bottom: 2px;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryGreen};
    border-bottom: 1px solid ${({ theme }) => theme.colors.primaryGreen};
  }
`;

export const FooterRouteLink = styled(Link)`
  font-family: ${({ theme }) => theme.font.body};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  border-bottom: 1px solid ${({ theme }) => `${theme.colors.textSecondary}40`};
  padding-bottom: 2px;
  cursor: pointer;
  transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryGreen};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }
`;

export const FooterExternalLink = styled.a`
  ${linkStyles}
`;

export const FooterLogoLink = styled.a`
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-top: -5px;
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

export const Separator = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.xl} 0
    ${({ theme }) => theme.spacing.lg};
`;

export const BottomSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

export const Copyright = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;

export const CreditText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;
