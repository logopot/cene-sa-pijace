import { Trans, useTranslation } from "react-i18next";
import { Container } from "react-bootstrap";
import LogopotLogo from "../LogopotLogo/LogopotLogo.jsx";
import { getDisclaimerPath, getFeedbackPath } from "../../constants/routeLocales.js";
import { withFallback } from "../../utils/feedbackText.js";
import {
  StyledFooter,
  TopSection,
  BrandColumn,
  Tagline,
  NavArea,
  NavColumn,
  NavList,
  FooterRouteLink,
  FooterLogoLink,
  Separator,
  BottomSection,
  Copyright,
  CreditText,
} from "./Footer.styled.js";

const PORTFOLIO_URL = "https://logopot.rs";

function PortfolioLink() {
  return (
    <FooterLogoLink
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <LogopotLogo size={40} />
    </FooterLogoLink>
  );
}

function Footer() {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const disclaimerPath = getDisclaimerPath(i18n.language);
  // The only entry point to the suggestions form. A plain URL: the form learns
  // the page the visitor came from by itself (see utils/lastRoute.js).
  const feedbackPath = getFeedbackPath(i18n.language);

  return (
    <StyledFooter>
      <Container>
        <TopSection>
          <BrandColumn>
            <Tagline>{t("footer.tagline")}</Tagline>
          </BrandColumn>

          <NavArea>
            <NavColumn>
              <NavList>
                <li>
                  <FooterRouteLink to={disclaimerPath}>
                    {t("footer.disclaimerLink")}
                  </FooterRouteLink>
                </li>
                <li>
                  <FooterRouteLink to={feedbackPath}>
                    {withFallback(t, i18n.language, "footer.feedbackLink")}
                  </FooterRouteLink>
                </li>
              </NavList>
            </NavColumn>
          </NavArea>
        </TopSection>

        <Separator />

        <BottomSection>
          <Copyright>{t("footer.copyright", { year })}</Copyright>
          <CreditText>
            <Trans
              i18nKey="footer.credit"
              components={{
                portfolioLink: <PortfolioLink />,
              }}
            />
          </CreditText>
        </BottomSection>
      </Container>
    </StyledFooter>
  );
}

export default Footer;
