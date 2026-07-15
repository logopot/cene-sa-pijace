import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { AppIconWrapper } from "../../styles/Card.styled.js";

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

export const StyledCard = styled(Card)`
  height: 100%;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  .card-body {
    padding: ${({ theme }) => theme.spacing.lg};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  /* margin-bottom: ${({ theme }) => theme.spacing.md}; */
  width: 100%;
`;

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`;

export const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
`;

export const CityName = styled(Card.Title)`
  font-size: 1.1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MarketName = styled(Card.Subtitle)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
