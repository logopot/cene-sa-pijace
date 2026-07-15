import { Trans, useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import Logo from '../Logo/Logo.jsx'
import { getDisclaimerPath } from '../../constants/routeLocales.js'
import {
  StyledFooter,
  TopSection,
  BrandColumn,
  BrandRow,
  BrandTitle,
  Tagline,
  NavArea,
  NavColumn,
  NavHeading,
  NavList,
  NavLink,
  Separator,
  BottomSection,
  Copyright,
  CreditText,
  PortfolioLink,
} from './Footer.styled.js'

const PORTFOLIO_URL = 'https://logopot.rs'

function Footer() {
  const { t, i18n } = useTranslation()
  const year = new Date().getFullYear()
  const disclaimerPath = getDisclaimerPath(i18n.language)

  return (
    <StyledFooter>
      <Container>
        <TopSection>
          <BrandColumn>
            <BrandRow>
              <Logo isHeaderVersion={false} size={36} />
              <BrandTitle>{t('app.name')}</BrandTitle>
            </BrandRow>
            <Tagline>{t('footer.tagline')}</Tagline>
          </BrandColumn>

          <NavArea>
            <NavColumn>
              <NavHeading>{t('footer.nav.exploreHeading')}</NavHeading>
              <NavList>
                <li>
                  <NavLink to="/">{t('nav.home')}</NavLink>
                </li>
                <li>
                  <NavLink to="/">{t('nav.markets')}</NavLink>
                </li>
                <li>
                  <NavLink to="/">{t('footer.nav.products')}</NavLink>
                </li>
              </NavList>
            </NavColumn>
            <NavColumn>
              <NavHeading>{t('footer.nav.aboutHeading')}</NavHeading>
              <NavList>
                <li>
                  <NavLink to={disclaimerPath}>{t('footer.disclaimerLink')}</NavLink>
                </li>
              </NavList>
            </NavColumn>
          </NavArea>
        </TopSection>

        <Separator />

        <BottomSection>
          <Copyright>{t('footer.copyright', { year })}</Copyright>
          <CreditText>
            <Trans
              i18nKey="footer.credit"
              components={{
                portfolioLink: <PortfolioLink href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" />,
              }}
            />
          </CreditText>
        </BottomSection>
      </Container>
    </StyledFooter>
  )
}

export default Footer
