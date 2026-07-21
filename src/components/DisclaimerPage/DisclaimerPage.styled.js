import styled from "styled-components";
import { AppIconWrapper } from "../../styles/Card.styled.js";

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 1.5rem 0 1rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.primaryGreen};
    color: ${({ theme }) => theme.colors.primaryGreen};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Below 768px, a long Title can wrap to two lines, so flex-start keeps the
// icon pinned to the first line instead of drifting toward the whole
// block's vertical middle - matches MarketCategoryDetails.styled.js's own
// PageHeader (same bug, same fix). Above 768px the title usually fits on one
// line, so centering reads better there.
export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primaryGreen};
  flex-wrap: wrap;

  @media (min-width: 768px) {
    align-items: center;
  }
`;

// The 4px nudge lines the icon's top edge up with Title's cap-height instead
// of the taller line box above it - only relevant while PageHeader is
// flex-start; centered alignment needs no such correction.
export const IconWrap = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
  margin-top: 4px;

  @media (min-width: 768px) {
    margin-top: 0;
  }
`;

export const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.textDark};
`;

export const Intro = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2rem;
`;

export const SourceNotice = styled.div`
  background-color: ${({ theme }) => theme.colors.iconBg};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: 2rem;
`;

export const Section = styled.section`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 1.5rem;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.75rem;
`;

export const Paragraph = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: 0.85rem;

  &:last-child {
    margin-bottom: 0;
  }
`;
