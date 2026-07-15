import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.jsx'
import Logo from '../Logo/Logo.jsx'
import { StyledNavbar, BrandLink, Brand } from './Header.styled'

function Header({ rows }) {
  const { t } = useTranslation()

  return (
    <StyledNavbar expand="lg">
      <Container>
        <BrandLink to="/">
          <Logo size={56} isHeaderVersion />
          <Brand as="span">{t('app.name')}</Brand>
        </BrandLink>
        <LanguageSwitcher rows={rows} />
      </Container>
    </StyledNavbar>
  )
}

export default Header
