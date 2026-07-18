import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container, Row } from 'react-bootstrap'
import { LuArrowLeft } from 'react-icons/lu'
import { ALL_MARKETS } from '../../constants/filters.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getCategoryUrlSlug } from '../../utils/categoryIcons.js'
import { buildMarketCategoryRoute } from '../../utils/market.js'
import CustomDropdown from '../CustomDropdown/CustomDropdown.jsx'
import LocationDetectButton from '../LocationDetectButton/LocationDetectButton.jsx'
import {
  BackButton,
  Bar,
  FieldLabel,
  FieldRow,
  MobileStepHeader,
  StepField,
  StepHeaderTop,
  StepIndicator,
  StepInstruction,
  SubmitButton,
} from './FilterBar.styled.js'

const STEP_CATEGORY = 0
const STEP_CITY = 1
const STEP_MARKET = 2
const TOTAL_STEPS = 3

// Indexed by step number - keep in sync with STEP_CATEGORY/STEP_CITY/STEP_MARKET.
const STEP_INSTRUCTION_KEYS = [
  'filterBar.stepInstructionCategory',
  'filterBar.stepInstructionCity',
  'filterBar.stepInstructionMarket',
]

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

  const categoryOptions = categories.map((cat) => ({ value: cat.name, label: t(`categories.${cat.slug}`) }))
  const cityOptions = cities.map((city) => ({ value: city, label: translateDataValue(t, 'grad', city) }))
  const marketOptions = [
    { value: ALL_MARKETS, label: t('filterBar.marketAllOption') },
    ...markets.map((market) => ({ value: market, label: translateDataValue(t, 'pijaca', market) })),
  ]

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
          <StepHeaderTop>
            <BackButton type="button" onClick={handleBack} $visible={step > STEP_CATEGORY}>
              <LuArrowLeft size={16} />
              {t('filterBar.back')}
            </BackButton>
            <StepIndicator>{t('filterBar.stepIndicator', { current: step + 1, total: TOTAL_STEPS })}</StepIndicator>
          </StepHeaderTop>
          <StepInstruction>{t(STEP_INSTRUCTION_KEYS[step])}</StepInstruction>
        </MobileStepHeader>

        <Row className="g-3 align-items-end">
          <StepField xs={12} md={3} $active={step === STEP_CATEGORY}>
            <FieldLabel>{t('filterBar.categoryLabel')}</FieldLabel>
            <CustomDropdown
              options={categoryOptions}
              value={category}
              onChange={handleCategoryChange}
              placeholder={t('filterBar.categoryPlaceholder')}
            />
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_CITY}>
            <FieldLabel>{t('filterBar.cityLabel')}</FieldLabel>
            <FieldRow>
              <CustomDropdown
                options={cityOptions}
                value={grad}
                onChange={handleGradChange}
                placeholder={t('filterBar.cityPlaceholder')}
                disabled={!category}
              />
              <LocationDetectButton cities={cities} onDetect={handleGradChange} disabled={!category} />
            </FieldRow>
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_MARKET}>
            <FieldLabel>{t('filterBar.marketLabel')}</FieldLabel>
            <CustomDropdown
              options={marketOptions}
              value={pijaca}
              onChange={onPijacaChange}
              placeholder={t('filterBar.marketAllOption')}
              disabled={!grad}
            />
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
