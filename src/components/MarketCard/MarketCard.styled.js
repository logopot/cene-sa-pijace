import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'

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
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
    border-color: ${({ theme }) => theme.colors.primaryGreen};
  }
`

export const IconWrap = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;

  svg {
    width: 24px;
    height: 24px;
  }
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

export const StatusRow = styled.div`
  margin-top: 0.6rem;
`
