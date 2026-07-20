import styled from 'styled-components'
import { AppIconWrapper } from '../../styles/Card.styled.js'

export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`

export const TitleGroup = styled.div`
  flex: 1;
  min-width: 0;
`

export const MarketTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`

export const CityLabel = styled.span`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
