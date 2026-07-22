import { useTranslation } from 'react-i18next'
import { TabList, TabButton } from './VariationSelector.styled.js'

// Segmented tab group above the Price History Chart, letting a product with
// several named sub-varieties (see useProductAnalytics.js's
// availableVariations) narrow the chart to just one of them instead of the
// whole merged family. Hidden entirely once there's nothing to disambiguate
// - a single variety (or none at all, e.g. a JKP-only product) makes an
// "all vs. that one variety" toggle pointless clutter above the chart.
function VariationSelector({ variations, selected, onSelect }) {
  const { t } = useTranslation()

  if (variations.length <= 1) return null

  return (
    <TabList role="tablist" aria-label={t('analytics.variationSelectorLabel')}>
      <TabButton
        type="button"
        role="tab"
        aria-selected={selected === 'all'}
        $isActive={selected === 'all'}
        onClick={() => onSelect('all')}
      >
        {t('analytics.allVariations')}
      </TabButton>
      {variations.map((variation) => (
        <TabButton
          key={variation.key}
          type="button"
          role="tab"
          aria-selected={selected === variation.key}
          $isActive={selected === variation.key}
          onClick={() => onSelect(variation.key)}
        >
          {variation.label}
        </TabButton>
      ))}
    </TabList>
  )
}

export default VariationSelector
