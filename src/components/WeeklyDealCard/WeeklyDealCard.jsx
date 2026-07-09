import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "../../utils/categoryIcons.js";
import { getTrendIcon } from "../../utils/trend.js";
import { parseMesto } from "../../utils/market.js";
import { translateDataValue } from "../../utils/translateValue.js";
import {
  buildProductFilters,
  buildProductRoute,
} from "../../utils/productId.js";
import { TrendIndicator } from "../ProductCard/ProductCard.styled.js";
import {
  CardLink,
  StyledCard,
  HeaderRow,
  IconCircle,
  ProductTitle,
  PriceTrendRow,
  PriceValue,
} from "./WeeklyDealCard.styled.js";

function formatPrice(value) {
  return value === null || value === undefined ? "-" : value.toFixed(2);
}

function WeeklyDealCard({ row }) {
  const { t, i18n } = useTranslation();
  const Icon = getCategoryIcon(row.Kategorija);
  const TrendIcon = getTrendIcon("pad");
  const { grad, pijaca } = parseMesto(row.Mesto);
  const productName = translateDataValue(t, "proizvod", row.Proizvod);

  return (
    <CardLink
      to={buildProductRoute(grad, pijaca, row, i18n.language)}
      state={{
        market: { grad, pijaca },
        returnTo: { category: row.Kategorija, grad, pijaca },
        productFilters: buildProductFilters(row),
      }}
      aria-label={t("productCard.viewAnalytics", { product: productName })}
    >
      <StyledCard>
        <HeaderRow>
          <IconCircle>
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable module-level reference, not created during render */}
            <Icon />
          </IconCircle>
          <ProductTitle>{productName}</ProductTitle>
        </HeaderRow>
        <PriceTrendRow>
          <PriceValue>
            {t("productCard.avgPriceValue", {
              price: formatPrice(row.CenaDom),
            })}
          </PriceValue>
          <TrendIndicator $trend="pad">
            {/* eslint-disable-next-line react-hooks/static-components -- TrendIcon is a stable module-level reference, not created during render */}
            <TrendIcon />
            {translateDataValue(t, "trend", "pad")}
          </TrendIndicator>
        </PriceTrendRow>
      </StyledCard>
    </CardLink>
  );
}

export default WeeklyDealCard;
