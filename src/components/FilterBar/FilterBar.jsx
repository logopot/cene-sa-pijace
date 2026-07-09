import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Col, Container, Form, Row } from 'react-bootstrap'
import { ALL_MARKETS } from '../../constants/filters.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getCategoryUrlSlug } from '../../utils/categoryIcons.js'
import { buildMarketCategoryRoute } from '../../utils/market.js'
import { Bar, FieldLabel, SubmitButton } from './FilterBar.styled.js'

function FilterBar({
  category,
  grad,
  pijaca,
  categories,
  cities,
  markets,
  onCategoryChange,
  onGradChange,
  onPijacaChange,
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const handleSubmit = () => {
    if (!category || !grad) return
    navigate(buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(category, i18n.language), i18n.language))
  }

  return (
    <Bar>
      <Container>
        <Row className="g-3 align-items-end">
          <Col xs={12} md={3}>
            <Form.Group controlId="filterBarCategory">
              <FieldLabel>{t('filterBar.categoryLabel')}</FieldLabel>
              <Form.Select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
                <option value="">{t('filterBar.categoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {t(`categories.${cat.slug}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={3}>
            <Form.Group controlId="filterBarCity">
              <FieldLabel>{t('filterBar.cityLabel')}</FieldLabel>
              <Form.Select value={grad} onChange={(e) => onGradChange(e.target.value)} disabled={!category}>
                <option value="">{t('filterBar.cityPlaceholder')}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {translateDataValue(t, 'grad', city)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={3}>
            <Form.Group controlId="filterBarMarket">
              <FieldLabel>{t('filterBar.marketLabel')}</FieldLabel>
              <Form.Select value={pijaca} onChange={(e) => onPijacaChange(e.target.value)} disabled={!grad}>
                <option value={ALL_MARKETS}>{t('filterBar.marketAllOption')}</option>
                {markets.map((market) => (
                  <option key={market} value={market}>
                    {translateDataValue(t, 'pijaca', market)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col xs={12} md={3}>
            <SubmitButton type="button" disabled={!category || !grad} onClick={handleSubmit}>
              {t('filterBar.submit')}
            </SubmitButton>
          </Col>
        </Row>
      </Container>
    </Bar>
  )
}

export default FilterBar
