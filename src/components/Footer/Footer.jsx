import { Trans, useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { StyledFooter, FooterInner, Copyright, DisclaimerLink, StipsLink } from './Footer.styled.js'

const STIPS_URL = 'https://www.stips.minpolj.gov.rs/'

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
          <DisclaimerLink to="/disclaimer">{t('footer.disclaimerLink')}</DisclaimerLink>
        </FooterInner>
      </Container>
    </StyledFooter>
  )
}

export default Footer
