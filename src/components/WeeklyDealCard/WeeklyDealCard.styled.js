import styled from "styled-components";
import { Link } from "react-router-dom";

export const CardLink = styled(Link)`
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: inherit;
    text-decoration: none;
  }
`;

export const StyledCard = styled.div`
  height: 100%;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

export const IconCircle = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ProductTitle = styled.div`
  min-width: 0;
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.titleDark};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PriceTrendRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 12px;
`;

export const PriceValue = styled.span`
  font-size: 1.15rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.titleDark};
  letter-spacing: -0.01em;
  white-space: nowrap;
`;
