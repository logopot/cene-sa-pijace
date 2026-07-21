import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { LuSearch } from 'react-icons/lu'
import { ALL_MARKETS, ALL_CATEGORIES } from '../../constants/filters.js'
import { translateDataValue } from '../../utils/translateValue.js'
import { getCategoryUrlSlug } from '../../utils/categoryIcons.js'
import { buildCityRoute, buildMarketRoute, buildMarketCategoryRoute } from '../../utils/market.js'
import CustomDropdown from '../CustomDropdown/CustomDropdown.jsx'
import LocationMenuItem from '../LocationDetectButton/LocationMenuItem.jsx'
import MobileFilterDrawer from '../MobileFilterDrawer/MobileFilterDrawer.jsx'
import { Bar, Sentinel, PillBar, SegmentDivider, SubmitCircle } from './FilterBar.styled.js'

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
  const sentinelRef = useRef(null)
  const [isStuck, setIsStuck] = useState(false)

  // Bar has reached its sticky top:0 position exactly when Sentinel (placed
  // immediately before it) scrolls out of the viewport - drives the
  // border/shadow that only appear once actually stuck (see FilterBar.styled.js).
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const categoryOptions = [
    { value: ALL_CATEGORIES, label: t('filterBar.categoryAllOption') },
    ...categories.map((cat) => ({ value: cat.name, label: t(`categories.${cat.slug}`) })),
  ]
  const cityOptions = cities.map((city) => ({ value: city, label: translateDataValue(t, 'grad', city) }))
  const marketOptions = [
    { value: ALL_MARKETS, label: t('filterBar.marketAllOption') },
    ...markets.map((market) => ({ value: market, label: translateDataValue(t, 'pijaca', market) })),
  ]

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
    <>
      <Sentinel ref={sentinelRef} aria-hidden="true" />
      <Bar $isStuck={isStuck}>
        <Container>
          <MobileFilterDrawer
            cities={cities}
            cityOptions={cityOptions}
            categoryOptions={categoryOptions}
            marketOptions={marketOptions}
            grad={grad}
            category={category}
            pijaca={pijaca}
            onGradChange={onGradChange}
            onCategoryChange={onCategoryChange}
            onPijacaChange={onPijacaChange}
            onSubmit={handleSubmit}
          />

          <PillBar>
            <CustomDropdown
              variant="segment"
              segmentPosition="first"
              label={t('filterBar.cityLabel')}
              options={cityOptions}
              value={grad}
              onChange={onGradChange}
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
              onChange={onCategoryChange}
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
    </>
  )
}

export default FilterBar
