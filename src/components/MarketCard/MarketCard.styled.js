import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import { AppIconWrapper } from '../../styles/Card.styled.js'

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
`

export const StyledCard = styled(Card)`
  height: 100%;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  .card-body {
    padding: ${({ theme }) => theme.spacing.lg};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-bottom: 0.75rem;
`

export const CityName = styled(Card.Title)`
  font-size: 1.1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-bottom: 0.15rem;
`

export const MarketName = styled(Card.Subtitle)`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const WorkingHoursRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const WorkingHoursLabel = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const WorkingHoursValue = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: ${({ $isOpen, theme }) => ($isOpen ? theme.colors.primaryGreen : theme.colors.danger)};
`
