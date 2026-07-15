import styled from "styled-components";
import { Link } from "react-router-dom";

export const StyledFooter = styled.footer`
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1.25rem 1.5rem;
`;

export const FooterInner = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const Copyright = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;

export const DisclaimerLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`;

export const StipsLink = styled.a`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`;

export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FooterSeparator = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
  user-select: none;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const CreditText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;

export const PortfolioLink = styled.a`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryGreen};
  }
`;
