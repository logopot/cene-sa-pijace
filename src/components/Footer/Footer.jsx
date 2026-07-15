import { Trans, useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import {
  StyledFooter,
  FooterInner,
  Copyright,
  DisclaimerLink,
  StipsLink,
  FooterRight,
  FooterSeparator,
  CreditText,
  PortfolioLink,
} from './Footer.styled.js'

const STIPS_URL = 'https://www.stips.minpolj.gov.rs/'
const PORTFOLIO_URL = 'https://logopot.rs'

function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <StyledFooter>
      <Container>
        <FooterInner>
          <Copyright>
            <Trans
              i18nKey="footer.copyright"
              values={{ year }}
              components={{
                stipsLink: <StipsLink href={STIPS_URL} target="_blank" rel="noopener noreferrer" />,
              }}
            />
          </Copyright>
          <FooterRight>
            <DisclaimerLink to="/disclaimer">{t('footer.disclaimerLink')}</DisclaimerLink>
            <FooterSeparator>•</FooterSeparator>
            <CreditText>
              <Trans
                i18nKey="footer.credit"
                components={{
                  portfolioLink: <PortfolioLink href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" />,
                }}
              />
            </CreditText>
          </FooterRight>
        </FooterInner>
      </Container>
    </StyledFooter>
  )
}

export default Footer
