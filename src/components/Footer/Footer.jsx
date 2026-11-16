import { Trans, useTranslation } from "react-i18next";
import { Container } from "react-bootstrap";
import LogopotLogo from "../LogopotLogo/LogopotLogo.jsx";
import { useLocation } from "react-router-dom";
import { getDisclaimerPath, getFeedbackPath, isFeedbackPath } from "../../constants/routeLocales.js";
import { isValidFromPath } from "../../utils/feedbackRules.js";
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
  const { pathname } = useLocation();
  // The only entry point to the suggestions form: it remembers the page the
  // visitor was on (see pages/Feedback). Left off when already on the form.
  const feedbackPath = getFeedbackPath(i18n.language);
  const feedbackLink =
    isFeedbackPath(pathname) || !isValidFromPath(pathname)
      ? feedbackPath
      : `${feedbackPath}?${new URLSearchParams({ from: pathname })}`;

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
                  <FooterRouteLink to={feedbackLink}>
                    {t("footer.feedbackLink")}
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
