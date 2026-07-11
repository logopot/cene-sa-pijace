import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container, Form, Row } from 'react-bootstrap'
import { ALL_MARKETS } from '../../constants/filters.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getCategoryUrlSlug } from '../../utils/categoryIcons.js'
import { buildMarketCategoryRoute } from '../../utils/market.js'
import {
  BackButton,
  Bar,
  FieldLabel,
  MobileStepHeader,
  StepField,
  StepIndicator,
  SubmitButton,
} from './FilterBar.styled.js'

const STEP_CATEGORY = 0
const STEP_CITY = 1
const STEP_MARKET = 2
const TOTAL_STEPS = 3

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
  // Drives the mobile "one field at a time" stepper only - the desktop layout
  // ignores it and always shows every field (see StepField's media query).
  const [step, setStep] = useState(STEP_CATEGORY)

  const handleCategoryChange = (value) => {
    onCategoryChange(value)
    setStep(value ? STEP_CITY : STEP_CATEGORY)
  }

  const handleGradChange = (value) => {
    onGradChange(value)
    setStep(value ? STEP_MARKET : STEP_CITY)
  }

  const handleBack = () => setStep((current) => Math.max(STEP_CATEGORY, current - 1))

  const handleSubmit = () => {
    if (!category || !grad) return
    navigate(buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(category, i18n.language), i18n.language))
  }

  return (
    <Bar>
      <Container>
        <MobileStepHeader>
          <BackButton type="button" onClick={handleBack} $visible={step > STEP_CATEGORY}>
            {t('filterBar.back')}
          </BackButton>
          <StepIndicator>{t('filterBar.stepIndicator', { current: step + 1, total: TOTAL_STEPS })}</StepIndicator>
        </MobileStepHeader>

        <Row className="g-3 align-items-end">
          <StepField xs={12} md={3} $active={step === STEP_CATEGORY}>
            <Form.Group controlId="filterBarCategory">
              <FieldLabel>{t('filterBar.categoryLabel')}</FieldLabel>
              <Form.Select value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="">{t('filterBar.categoryPlaceholder')}</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {t(`categories.${cat.slug}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_CITY}>
            <Form.Group controlId="filterBarCity">
              <FieldLabel>{t('filterBar.cityLabel')}</FieldLabel>
              <Form.Select value={grad} onChange={(e) => handleGradChange(e.target.value)} disabled={!category}>
                <option value="">{t('filterBar.cityPlaceholder')}</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {translateDataValue(t, 'grad', city)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_MARKET}>
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
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_MARKET}>
            <SubmitButton type="button" disabled={!category || !grad} onClick={handleSubmit}>
              {t('filterBar.submit')}
            </SubmitButton>
          </StepField>
        </Row>
      </Container>
    </Bar>
  )
}

export default FilterBar
