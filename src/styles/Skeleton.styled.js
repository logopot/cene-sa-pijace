import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
`

// Shared placeholder block - sized by each consumer's own styled(...) layer.
export const SkeletonBlock = styled.div`
  border-radius: ${({ theme }) => theme.radius.md};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.borderLight} 25%,
    ${({ theme }) => theme.colors.border} 37%,
    ${({ theme }) => theme.colors.borderLight} 63%
  );
  background-size: 400% 100%;
  animation: ${shimmer} 1.4s ease infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`
