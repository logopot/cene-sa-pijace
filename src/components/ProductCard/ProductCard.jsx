import { useTranslation } from "react-i18next";
import { Card } from "react-bootstrap";
import { getCategoryIcon } from "../../utils/categoryIcons.js";
import { parseMesto } from "../../utils/market.js";
import { translateDataValue } from "../../utils/translateValue.js";
import { classifyComment } from "../../utils/comment.js";
import { spaceBeforeParens } from "../../utils/formatText.js";
import { getTrendIcon } from "../../utils/trend.js";
import { getDisplayPrice, formatDisplayPrice, formatPriceValue, hasPrice } from "../../utils/price.js";
import { isBlank } from "../../utils/blank.js";
import { resolveUnit } from "../../utils/unit.js";
import { getSourceLabel } from "../../utils/marketTime.js";

import { buildProductRoute } from "../../utils/productId.js";
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
  const jedMere = translateDataValue(
    t,
    "jedMere",
    resolveUnit(row.JedMere, row.Kategorija),
  );
  const pakovanje = translateDataValue(
    t,
    "pakovanje",
    resolveUnit(row.Pakovanje, row.Kategorija),
  );
  const poreklo = spaceBeforeParens(
    translateDataValue(t, "poreklo", row.Poreklo),
  );
  const ponuda = translateDataValue(t, "ponuda", row.Ponuda);
  // JKP archive rows already carry their own attributed Source (see
  // scripts/jkp-scraper); only STIPS rows need the marketInfo.json lookup.
  const sourceLabel = row.Source || getSourceLabel(grad, pijaca);
  // No trend data (STIPS writes "-", JKP rows have none at all) means no
  // badge at all - never a made-up "no trend" label.
  const hasTrendData = KNOWN_TRENDS.has(row.Trend);
  const trend = hasTrendData ? translateDataValue(t, "trend", row.Trend) : "";
  const TrendIcon = getTrendIcon(row.Trend);
  const comment = classifyComment(row.Komentar);
  const displayPrice = getDisplayPrice(row);

  // Tag rows: price + packaging, then origin + offer. Only fields the source
  // actually reports (not empty, not a placeholder like "-"/"n/a") become
  // elements; an empty field leaves nothing in the DOM. A tag that is alone in
  // its row spans the full width, a pair splits it. Nothing is ever
  // substituted for a missing value.
  const metaTags = [
    [
      {
        key: "avgPrice",
        label: t("productCard.avgPrice"),
        value: hasPrice(row.CenaDom) ? t("productCard.avgPriceValue", { price: formatPriceValue(row.CenaDom) }) : "",
      },
      { key: "packaging", label: t("productCard.packaging"), value: pakovanje },
    ],
    [
      { key: "origin", label: t("productCard.origin"), value: poreklo },
      { key: "offer", label: t("productCard.offer"), value: ponuda },
    ],
  ].flatMap((slots) => {
    const filled = slots.filter((slot) => !isBlank(slot.value));
    return filled.map((slot) => ({ ...slot, fullWidth: filled.length === 1 }));
  });
  const locationLabel = `${pijacaLabel}, ${gradLabel}`;

  return (
    <CardLink
      to={buildProductRoute(grad, pijaca, row, i18n.language)}
      state={{
        market: { grad, pijaca },
        returnTo: selection,
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
                <ProductTitle title={productName}>{productName}</ProductTitle>
                <MarketSubtitle title={locationLabel}>{locationLabel}</MarketSubtitle>
              </div>
            </TitleBlock>
          </CardHeader>

          {metaTags.length > 0 && (
            <MetaGrid>
              {metaTags.map(({ key, label, value, fullWidth }) => (
                <MetaBadge key={key} $fullWidth={fullWidth}>
                  <MetaLabel title={label}>{label}</MetaLabel>
                  <MetaValue title={value}>{value}</MetaValue>
                </MetaBadge>
              ))}
            </MetaGrid>
          )}

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
            <CommentText title={comment.value}>{comment.value}</CommentText>
          )}

          {displayPrice && (
            <PriceValue>
              {formatDisplayPrice(displayPrice)}{" "}
              {jedMere ?
                t("productCard.priceUnit", { unit: jedMere })
              : t("productCard.priceNoUnit")}
            </PriceValue>
          )}

          <CardFooter>
            <SourceTag>
              {t("productCard.source", { source: sourceLabel })}
            </SourceTag>
            {hasTrendData && (
              <TrendIndicator $trend={row.Trend}>
                {/* eslint-disable-next-line react-hooks/static-components -- TrendIcon is a stable module-level reference, not created during render */}
                <TrendIcon />
                {trend}
              </TrendIndicator>
            )}
          </CardFooter>
        </Card.Body>
      </StyledCard>
    </CardLink>
  );
}

export default ProductCard;
