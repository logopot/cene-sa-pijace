import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { LuArrowLeft, LuSearch } from 'react-icons/lu'
import { ALL_MARKETS, ALL_CATEGORIES } from '../../constants/filters.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getCategoryUrlSlug } from '../../utils/categoryIcons.js'
import { buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../../utils/market.js'
import CustomDropdown from '../CustomDropdown/CustomDropdown.jsx'
import LocationDetectButton from '../LocationDetectButton/LocationDetectButton.jsx'
import LocationMenuItem from '../LocationDetectButton/LocationMenuItem.jsx'
import {
  BackButton,
  Bar,
  FieldLabel,
  FieldRow,
  MobileFieldsRow,
  MobileStepHeader,
  PillBar,
  SegmentDivider,
  StepField,
  StepHeaderTop,
  StepIndicator,
  StepInstruction,
  SubmitButton,
  SubmitCircle,
} from './FilterBar.styled.js'

const STEP_CITY = 0
const STEP_CATEGORY = 1
const STEP_MARKET = 2
const TOTAL_STEPS = 3

// Indexed by step number - keep in sync with STEP_CITY/STEP_CATEGORY/STEP_MARKET.
const STEP_INSTRUCTION_KEYS = [
  'filterBar.stepInstructionCity',
  'filterBar.stepInstructionCategory',
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
  // Drives the mobile "one field at a time" stepper only (MobileFieldsRow) -
  // the desktop segmented pill bar (PillBar) always shows every field at
  // once regardless of step.
  const [step, setStep] = useState(STEP_CITY)

  const categoryOptions = [
    { value: ALL_CATEGORIES, label: t('filterBar.categoryAllOption') },
    ...categories.map((cat) => ({ value: cat.name, label: t(`categories.${cat.slug}`) })),
  ]
  const cityOptions = cities.map((city) => ({ value: city, label: translateDataValue(t, 'grad', city) }))
  const marketOptions = [
    { value: ALL_MARKETS, label: t('filterBar.marketAllOption') },
    ...markets.map((market) => ({ value: market, label: translateDataValue(t, 'pijaca', market) })),
  ]

  const handleGradChange = (value) => {
    onGradChange(value)
    setStep(value ? STEP_CATEGORY : STEP_CITY)
  }

  const handleCategoryChange = (value) => {
    onCategoryChange(value)
    setStep(value ? STEP_MARKET : STEP_CATEGORY)
  }

  const handleBack = () => setStep((current) => Math.max(STEP_CITY, current - 1))

  // A real category still goes to the dedicated category-results page; the
  // "Sve kategorije" sentinel has no route of its own, so it falls back to
  // whichever page already shows every category - the specific market page,
  // or the whole city if no specific market was picked either.
  const handleSubmit = () => {
    if (!grad) return
    if (category && category !== ALL_CATEGORIES) {
      navigate(buildMarketCategoryRoute(grad, pijaca, getCategoryUrlSlug(category, i18n.language), i18n.language))
    } else if (pijaca && pijaca !== ALL_MARKETS) {
      navigate(buildMarketRoute(grad, pijaca, i18n.language))
    } else {
      navigate(buildCityRoute(grad, i18n.language))
    }
  }

  return (
    <Bar>
      <Container>
        <MobileStepHeader>
          <StepHeaderTop>
            <BackButton type="button" onClick={handleBack} $visible={step > STEP_CITY}>
              <LuArrowLeft size={16} />
              {t('filterBar.back')}
            </BackButton>
            <StepIndicator>{t('filterBar.stepIndicator', { current: step + 1, total: TOTAL_STEPS })}</StepIndicator>
          </StepHeaderTop>
          <StepInstruction>{t(STEP_INSTRUCTION_KEYS[step])}</StepInstruction>
        </MobileStepHeader>

        <MobileFieldsRow className="g-3 align-items-end">
          <StepField xs={12} md={3} $active={step === STEP_CITY}>
            <FieldLabel>{t('filterBar.cityLabel')}</FieldLabel>
            <FieldRow>
              <CustomDropdown
                options={cityOptions}
                value={grad}
                onChange={handleGradChange}
                placeholder={t('filterBar.cityPlaceholder')}
              />
              <LocationDetectButton cities={cities} onDetect={handleGradChange} />
            </FieldRow>
          </StepField>

          <StepField xs={12} md={3} $active={step === STEP_CATEGORY}>
            <FieldLabel>{t('filterBar.categoryLabel')}</FieldLabel>
            <CustomDropdown
              options={categoryOptions}
              value={category}
              onChange={handleCategoryChange}
              placeholder={t('filterBar.categoryPlaceholder')}
              disabled={!grad}
            />
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
            <SubmitButton type="button" disabled={!grad} onClick={handleSubmit}>
              {t('filterBar.submit')}
            </SubmitButton>
          </StepField>
        </MobileFieldsRow>

        <PillBar>
          <CustomDropdown
            variant="segment"
            segmentPosition="first"
            label={t('filterBar.cityLabel')}
            options={cityOptions}
            value={grad}
            onChange={handleGradChange}
            placeholder={t('filterBar.cityPlaceholder')}
            leadingAction={({ onSelect }) => <LocationMenuItem cities={cities} onSelect={onSelect} />}
          />

          <SegmentDivider aria-hidden="true" />

          <CustomDropdown
            variant="segment"
            segmentPosition="middle"
            label={t('filterBar.categoryLabel')}
            options={categoryOptions}
            value={category}
            onChange={handleCategoryChange}
            placeholder={t('filterBar.categoryPlaceholder')}
            disabled={!grad}
          />

          <SegmentDivider aria-hidden="true" />

          <CustomDropdown
            variant="segment"
            segmentPosition="last"
            label={t('filterBar.marketLabel')}
            options={marketOptions}
            value={pijaca}
            onChange={onPijacaChange}
            placeholder={t('filterBar.marketAllOption')}
            disabled={!grad}
          />

          <SubmitCircle type="button" disabled={!grad} onClick={handleSubmit} aria-label={t('filterBar.submit')}>
            <LuSearch />
          </SubmitCircle>
        </PillBar>
      </Container>
    </Bar>
  )
}

export default FilterBar
