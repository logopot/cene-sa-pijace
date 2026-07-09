import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.jsx'
import { StyledNavbar, BrandLink, Brand, Tagline } from './Header.styled'

function Header({ rows }) {
  const { t } = useTranslation()

  return (
    <StyledNavbar expand="lg">
      <Container>
        <BrandLink to="/">
          <Brand as="span">{t('app.name')}</Brand>
          <Tagline>{t('header.tagline')}</Tagline>
        </BrandLink>
        <LanguageSwitcher rows={rows} />
      </Container>
    </StyledNavbar>
  )
}

export default Header
