import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuChevronDown, LuSearch, LuX } from 'react-icons/lu'
import LocationMenuItem from '../LocationDetectButton/LocationMenuItem.jsx'
import { SubmitButton } from '../FilterBar/FilterBar.styled.js'
import {
  TriggerBar,
  Overlay,
  Header,
  CloseButton,
  Content,
  RowWrapper,
  RowHeader,
  RowHeaderText,
  RowLabel,
  RowValue,
  RowPanel,
  RowPanelInner,
  OptionList,
  OptionButton,
  Footer,
} from './MobileFilterDrawer.styled.js'

const SECTION_GRAD = 'grad'
const SECTION_CATEGORY = 'category'
const SECTION_MARKET = 'market'

// One collapsible Grad/Kategorija/Pijaca row - always rendered (even before
// a city is picked, for Grad itself), sharing the same header chrome and
// grid-rows expand animation regardless of what's inside.
function AccordionRow({ label, value, placeholder, isExpanded, onToggle, children }) {
  return (
    <RowWrapper>
      <RowHeader type="button" onClick={onToggle} aria-expanded={isExpanded}>
        <RowHeaderText>
          <RowLabel>{label}</RowLabel>
          <RowValue $isPlaceholder={!value}>{value || placeholder}</RowValue>
        </RowHeaderText>
        <LuChevronDown size={18} />
      </RowHeader>
      <RowPanel $isExpanded={isExpanded}>
        <RowPanelInner>{children}</RowPanelInner>
      </RowPanel>
    </RowWrapper>
  )
}

// Mobile-only (<768px) accordion search drawer - FilterBar.jsx's desktop
// PillBar covers wider viewports instead. Owns its own open/expanded-section
// state; grad/category/pijaca themselves are still owned by the shared
// useMarketExplorer state one level up (see FilterBar.jsx), so closing and
// reopening the drawer never loses a selection already made.
function MobileFilterDrawer({
  cities,
  cityOptions,
  categoryOptions,
  marketOptions,
  grad,
  category,
  pijaca,
  onGradChange,
  onCategoryChange,
  onPijacaChange,
  onSubmit,
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState(SECTION_GRAD)

  const gradLabel = cityOptions.find((option) => option.value === grad)?.label
  const categoryLabel = categoryOptions.find((option) => option.value === category)?.label
  const marketLabel = marketOptions.find((option) => option.value === pijaca)?.label

  // Reopening after a city was already picked (a returning user, not a
  // first-time open) goes straight to the accordion summary view instead of
  // forcing Grad open again - "first time" per the spec means "no city yet."
  const openDrawer = () => {
    setExpandedSection(grad ? null : SECTION_GRAD)
    setIsOpen(true)
  }

  const closeDrawer = () => setIsOpen(false)

  const toggleSection = (section) => {
    setExpandedSection((current) => (current === section ? null : section))
  }

  const handleGradSelect = (value) => {
    onGradChange(value)
    setExpandedSection(null)
  }

  const handleCategorySelect = (value) => {
    onCategoryChange(value)
    setExpandedSection(null)
  }

  const handleMarketSelect = (value) => {
    onPijacaChange(value)
    setExpandedSection(null)
  }

  const handleSubmit = () => {
    onSubmit()
    closeDrawer()
  }

  return (
    <>
      <TriggerBar type="button" onClick={openDrawer}>
        <LuSearch size={18} />
        {t('filterBar.mobileTriggerLabel')}
      </TriggerBar>

      {isOpen && (
        <Overlay>
          <Header>
            <CloseButton type="button" onClick={closeDrawer} aria-label={t('filterBar.close')}>
              <LuX size={20} />
            </CloseButton>
          </Header>

          <Content>
            <AccordionRow
              label={t('filterBar.cityLabel')}
              value={gradLabel}
              placeholder={t('filterBar.cityPlaceholder')}
              isExpanded={expandedSection === SECTION_GRAD}
              onToggle={() => toggleSection(SECTION_GRAD)}
            >
              <LocationMenuItem cities={cities} onSelect={handleGradSelect} />
              <OptionList>
                {cityOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    type="button"
                    $isSelected={option.value === grad}
                    onClick={() => handleGradSelect(option.value)}
                  >
                    {option.label}
                  </OptionButton>
                ))}
              </OptionList>
            </AccordionRow>

            {/* Kategorija/Pijaca stay out of the DOM entirely until a city is
                picked (State 1) - they're meaningless without one, same gate
                as the desktop segments' own disabled state. */}
            {grad && (
              <>
                <AccordionRow
                  label={t('filterBar.categoryLabel')}
                  value={categoryLabel}
                  isExpanded={expandedSection === SECTION_CATEGORY}
                  onToggle={() => toggleSection(SECTION_CATEGORY)}
                >
                  <OptionList>
                    {categoryOptions.map((option) => (
                      <OptionButton
                        key={option.value}
                        type="button"
                        $isSelected={option.value === category}
                        onClick={() => handleCategorySelect(option.value)}
                      >
                        {option.label}
                      </OptionButton>
                    ))}
                  </OptionList>
                </AccordionRow>

                <AccordionRow
                  label={t('filterBar.marketLabel')}
                  value={marketLabel}
                  isExpanded={expandedSection === SECTION_MARKET}
                  onToggle={() => toggleSection(SECTION_MARKET)}
                >
                  <OptionList>
                    {marketOptions.map((option) => (
                      <OptionButton
                        key={option.value}
                        type="button"
                        $isSelected={option.value === pijaca}
                        onClick={() => handleMarketSelect(option.value)}
                      >
                        {option.label}
                      </OptionButton>
                    ))}
                  </OptionList>
                </AccordionRow>
              </>
            )}
          </Content>

          {grad && (
            <Footer>
              <SubmitButton type="button" onClick={handleSubmit}>
                {t('filterBar.submit')}
              </SubmitButton>
            </Footer>
          )}
        </Overlay>
      )}
    </>
  )
}

export default MobileFilterDrawer
