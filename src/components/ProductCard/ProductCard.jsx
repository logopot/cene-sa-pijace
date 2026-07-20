import { useTranslation } from "react-i18next";
import { Card } from "react-bootstrap";
import { getCategoryIcon } from "../../utils/categoryIcons.js";
import { parseMesto } from "../../utils/market.js";
import { translateDataValue } from "../../utils/translateValue.js";
import { classifyComment } from "../../utils/comment.js";
import { spaceBeforeParens } from "../../utils/formatText.js";
import { getTrendIcon } from "../../utils/trend.js";
import { getDisplayPrice } from "../../utils/price.js";
import { getSourceLabel } from "../../utils/marketTime.js";

import {
  buildProductFilters,
  buildProductRoute,
} from "../../utils/productId.js";
import {
  CardLink,
  StyledCard,
  CardHeader,
  IconCircle,
  TitleBlock,
  ProductTitle,
  MarketSubtitle,
  SourceTag,
  MetaGrid,
  MetaBadge,
  MetaLabel,
  MetaValue,
  FieldRow,
  FieldLabel,
  FieldValue,
  PriceValue,
  CardFooter,
  TrendIndicator,
  CommentText,
} from "./ProductCard.styled.js";

const KNOWN_TRENDS = new Set(["rast", "pad", "bez promene"]);

function formatPrice(value) {
  return value === null || value === undefined ? "-" : value.toFixed(2);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ProductCard({ row, selection }) {
  const { t, i18n } = useTranslation();

  const { grad, pijaca } = parseMesto(row.Mesto);

  const Icon = getCategoryIcon(row.Kategorija);
  const productName = translateDataValue(t, "proizvod", row.Proizvod);
  const gradLabel = translateDataValue(t, "grad", grad);
  const pijacaLabel = translateDataValue(t, "pijaca", pijaca);
  const jedMere = translateDataValue(t, "jedMere", row.JedMere);
  const pakovanje = translateDataValue(t, "pakovanje", row.Pakovanje);
  const poreklo = spaceBeforeParens(
    translateDataValue(t, "poreklo", row.Poreklo),
  );
  const ponuda = translateDataValue(t, "ponuda", row.Ponuda);
  // JKP archive rows already carry their own attributed Source (see
  // scripts/jkp-scraper); only STIPS rows need the marketInfo.json lookup.
  const sourceLabel = row.Source || getSourceLabel(grad, pijaca);
  // STIPS uses "-" as a placeholder for animals/products with no comparable
  // prior price - this still gets its own "no trend" indicator rather than an
  // empty one, since historical data may exist even without a trend.
  const hasTrendData = KNOWN_TRENDS.has(row.Trend);
  const trend =
    hasTrendData ?
      translateDataValue(t, "trend", row.Trend)
    : t("productCard.noTrend");
  const TrendIcon = getTrendIcon(row.Trend);
  const trendVariant = hasTrendData ? row.Trend : "none";
  const comment = classifyComment(row.Komentar);
  const displayPrice = getDisplayPrice(row);

  return (
    <CardLink
      to={buildProductRoute(grad, pijaca, row, i18n.language)}
      state={{
        market: { grad, pijaca },
        returnTo: selection,
        productFilters: buildProductFilters(row),
      }}
      aria-label={t("productCard.viewAnalytics", { product: productName })}
    >
      <StyledCard>
        <Card.Body>
          <CardHeader>
            <IconCircle>
              {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable module-level reference, not created during render */}
              <Icon />
            </IconCircle>
            <TitleBlock>
              <div
                className="product-title-container"
                data-testid="product-title-container"
              >
                <ProductTitle>{productName}</ProductTitle>
                <MarketSubtitle>
                  {pijacaLabel}, {gradLabel}
                </MarketSubtitle>
              </div>
            </TitleBlock>
          </CardHeader>

          <MetaGrid>
            <MetaBadge>
              <MetaLabel>{t("productCard.avgPrice")}</MetaLabel>
              <MetaValue>
                {t("productCard.avgPriceValue", {
                  price: formatPrice(row.CenaDom),
                })}
              </MetaValue>
            </MetaBadge>
            <MetaBadge>
              <MetaLabel>{t("productCard.packaging")}</MetaLabel>
              <MetaValue>{pakovanje || "-"}</MetaValue>
            </MetaBadge>
            <MetaBadge>
              <MetaLabel>{t("productCard.origin")}</MetaLabel>
              <MetaValue>{poreklo || "-"}</MetaValue>
            </MetaBadge>
            <MetaBadge>
              <MetaLabel>{t("productCard.offer")}</MetaLabel>
              <MetaValue>{ponuda || "-"}</MetaValue>
            </MetaBadge>
          </MetaGrid>

          {comment?.type === "country" && (
            <FieldRow>
              <FieldLabel>{t("productCard.importCountry")}</FieldLabel>
              <FieldValue>
                {capitalize(translateDataValue(t, "countries", comment.value))}
              </FieldValue>
            </FieldRow>
          )}
          {comment?.type === "packaging" && (
            <FieldRow>
              <FieldLabel>{t("productCard.extraPackaging")}</FieldLabel>
              <FieldValue>{comment.value}</FieldValue>
            </FieldRow>
          )}
          {comment?.type === "text" && (
            <CommentText>{comment.value}</CommentText>
          )}

          {displayPrice && (
            <PriceValue>
              {displayPrice.type === "range" ?
                `${formatPrice(displayPrice.min)} - ${formatPrice(displayPrice.max)}`
              : formatPrice(displayPrice.value)}{" "}
              {t("productCard.priceUnit", { unit: jedMere })}
            </PriceValue>
          )}

          <CardFooter>
            <SourceTag>
              {t("productCard.source", { source: sourceLabel })}
            </SourceTag>
            <TrendIndicator
              $trend={trendVariant}
              title={hasTrendData ? undefined : t("productCard.noTrendTitle")}
            >
              {TrendIcon ?
                // eslint-disable-next-line react-hooks/static-components -- TrendIcon is a stable module-level reference, not created during render
                <TrendIcon />
              : <span>-</span>}
              {trend}
            </TrendIndicator>
          </CardFooter>
        </Card.Body>
      </StyledCard>
    </CardLink>
  );
}

export default ProductCard;
