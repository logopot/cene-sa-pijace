import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.jsx'
import Logo from '../Logo/Logo.jsx'
import FilterBar from '../FilterBar/FilterBar.jsx'
import { useFilterState } from '../../hooks/useFilterState.js'
import { useFilterOptions } from '../../hooks/useFilterOptions.js'
import { StyledNavbar, BrandLink, Brand } from './Header.styled'

// Global search bar (see FilterContext.jsx) now lives here instead of only
// the homepage, so it renders - and stays pre-filled - on every route.
// Hidden when rows hasn't loaded yet (an empty/error data fetch), matching
// the previous behavior where MarketExplorer's own loading/error branches
// never rendered it either.
function Header({ rows }) {
  const { t } = useTranslation()
  const { grad, category, pijaca, setGrad, setCategory, setPijaca } = useFilterState()
  const { cities, categories, markets } = useFilterOptions(rows, grad, category)

  return (
    <>
      <StyledNavbar expand="lg">
        <Container>
          <BrandLink to="/">
            <Logo size={56} isHeaderVersion />
            <Brand as="span">{t('app.name')}</Brand>
          </BrandLink>
          <LanguageSwitcher rows={rows} />
        </Container>
      </StyledNavbar>

      {rows.length > 0 && (
        <FilterBar
          category={category}
          grad={grad}
          pijaca={pijaca}
          categories={categories}
          cities={cities}
          markets={markets}
          onCategoryChange={setCategory}
          onGradChange={setGrad}
          onPijacaChange={setPijaca}
        />
      )}
    </>
  )
}

export default Header
