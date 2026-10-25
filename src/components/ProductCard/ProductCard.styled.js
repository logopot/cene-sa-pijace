import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";
import { AppIconWrapper } from "../../styles/Card.styled.js";

export const StyledCard = styled(Card)`
  position: relative;
  z-index: 1;
  height: 100%;
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  container-type: inline-size;
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  .card-body {
    display: flex;
    flex-direction: column;
    padding: ${({ theme }) => theme.spacing.lg};
  }

  /* Without position+z-index a hovered card is still a static-flow sibling,
     so its enlarged shadow paints *underneath* the next card in DOM order
     (grid row-wrap or the WeeklyTrends carousel) and reads as clipped at
     that shared edge, even though nothing is actually overflow:hidden. */
  &:hover {
    z-index: 10;
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
  }
`;

// Wraps StyledCard rather than replacing its tag via "as" - an <a> taking over
// the card's own flex/width rules previously collapsed it to content width,
// clipping the price row after the unit. This wrapper only ever contributes
// block-level sizing and link resets; all card visuals stay on StyledCard.
export const CardLink = styled(Link)`
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: inherit;
    text-decoration: none;
  }

  &:focus-visible ${StyledCard} {
    box-shadow: ${({ theme }) => theme.shadow.cardHover};
    outline: 2px solid ${({ theme }) => theme.colors.primaryGreen};
    outline-offset: 2px;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

export const IconCircle = styled(AppIconWrapper)`
  background-color: ${({ theme }) => theme.colors.iconBg};
  color: ${({ theme }) => theme.colors.primaryGreen};
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxs};
  min-width: 0;
  text-align: left;
`;

// Two-line clamp: a very long name is cut with an ellipsis (full text in the
// title attribute) so one unusually long card cannot inflate the others.
const clampLines = (lines) => `
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${lines};
  line-clamp: ${lines};
  overflow: hidden;
  overflow-wrap: anywhere;
`;

export const ProductTitle = styled(Card.Title)`
  ${clampLines(2)}
  font-size: 1.15rem;
  line-height: 1.25;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.titleDark};
  margin-bottom: 0;
  min-width: 0;
`;

export const MarketSubtitle = styled(Card.Subtitle)`
  ${clampLines(2)}
  font-size: 0.875rem;
  line-height: 1.3;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  text-align: left;
`;

// Footer items share one row height (the trend badge's), so the divider above
// sits at the same place whether or not a badge is rendered.
const FOOTER_ITEM_HEIGHT = "1.75rem";

export const SourceTag = styled.span`
  min-width: 0;
  line-height: ${FOOTER_ITEM_HEIGHT};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Tags flow into two columns; a tag that is alone in its row spans both.
// Sized by content only - equal card heights come from the list/carousel
// container, not from reserving space here.
export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
`;

export const MetaBadge = styled.div`
  grid-column: ${({ $fullWidth }) => ($fullWidth ? "1 / -1" : "auto")};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.15rem;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.45rem 0.65rem;
  min-width: 0;
`;

export const MetaLabel = styled.span`
  max-width: 100%;
  font-size: 0.68rem;
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MetaValue = styled.span`
  max-width: 100%;
  font-size: 0.85rem;
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.textDark};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.3rem 0;
`;

export const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

export const FieldValue = styled.span`
  color: ${({ theme }) => theme.colors.textDark};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  text-align: right;
`;

export const PriceValue = styled.div`
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.titleDark};
  letter-spacing: -0.02em;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  @container (max-width: 340px) {
    font-size: 1.2rem;
  }

  @container (max-width: 280px) {
    font-size: 1.05rem;
  }
`;

// Merges the source attribution and the trend indicator into one row so the
// card doesn't need two separate trailing lines.
export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  margin-top: 0;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const TREND_VARIANTS = {
  rast: {
    bg: ({ theme }) => theme.colors.dangerTintSoft,
    fg: ({ theme }) => theme.colors.danger,
  },
  pad: {
    bg: ({ theme }) => theme.colors.primaryTintSoft,
    fg: ({ theme }) => theme.colors.primaryGreen,
  },
  "bez promene": {
    bg: ({ theme }) => theme.colors.neutralTintSoft,
    fg: ({ theme }) => theme.colors.textSecondary,
  },
  none: {
    bg: ({ theme }) => theme.colors.neutralTintSoft,
    fg: ({ theme }) => theme.colors.textMuted,
  },
};

function trendVariant($trend) {
  return TREND_VARIANTS[$trend] ?? TREND_VARIANTS.none;
}

// Minimalist fintech-style trend tag: tinted background, colored typography,
// a micro-chevron icon - no pill border, kept light and text-forward.
export const TrendIndicator = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.8rem;
  height: ${FOOTER_ITEM_HEIGHT};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0 0.6rem;
  background-color: ${(props) => trendVariant(props.$trend).bg(props)};
  color: ${(props) => trendVariant(props.$trend).fg(props)};

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

export const CommentText = styled.p`
  font-size: 0.8rem;
  font-style: italic;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  padding-top: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
