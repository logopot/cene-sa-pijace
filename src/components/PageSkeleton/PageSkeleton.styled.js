import styled from 'styled-components'
import { SkeletonBlock } from '../../styles/Skeleton.styled.js'

export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.lg} 0;
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`

export const CardPlaceholder = styled(SkeletonBlock)`
  height: 360px;
  border-radius: ${({ theme }) => theme.radius.xl};
`
