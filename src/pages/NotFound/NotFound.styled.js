import styled from "styled-components";
import { Link } from "react-router-dom";

export const PageWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

export const Watermark = styled.div`
  position: absolute;
  z-index: 1;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12rem;
  font-weight: 900;
  letter-spacing: 0.5rem;
  text-transform: uppercase;
  opacity: 0.03;
  color: ${({ theme }) => theme.colors.titleDark};
  pointer-events: none;
  user-select: none;
`;

export const Content = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 40px;
`;

export const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.titleDark};
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
`;

export const Description = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 460px;
  line-height: 1.6;
  margin: 0 auto 2rem auto;
`;

export const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primaryGreen};
  color: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.heading};
  font-size: 0.95rem;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-decoration: none;
  padding: 0.75rem 1.75rem;
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadow.xs};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    color: ${({ theme }) => theme.colors.surface};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${({ theme }) => theme.shadow.xs};
  }
`;
