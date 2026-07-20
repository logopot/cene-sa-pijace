import { useTranslation } from 'react-i18next'
import { LuBadgeCheck } from 'react-icons/lu'
import { StatusBadge, TextGroup, SourceName, DateMeta } from './WeekStatus.styled.js'

// Keyed by the same Source-presence convention useProductAnalytics.js
// already uses to split STIPS vs JKP points (row.Source is only ever
// populated on JKP archive rows) - kept here so the badge's copy stays a
// simple lookup instead of another if/else branch.
const SOURCE_KEYS = {
  STIPS: 'weekStatus.stips',
  JKP: 'weekStatus.jkp',
}

// Always the verified checkmark, regardless of whether this week is the
// dataset's true latest or a market-specific fallback - a market lagging a
// week behind is still official STIPS/JKP data, not a lesser "archived"
// state, so the icon no longer swaps to communicate that distinction.
function WeekStatus({ weekLabel, source }) {
  const { t } = useTranslation()
  if (!weekLabel) return null

  const sourceKey = SOURCE_KEYS[source] ?? SOURCE_KEYS.STIPS

  return (
    <StatusBadge>
      <LuBadgeCheck />
      <TextGroup>
        <SourceName>{t(sourceKey)}</SourceName>
        <DateMeta>{t('weekStatus.dateRange', { value: weekLabel })}</DateMeta>
      </TextGroup>
    </StatusBadge>
  )
}

export default WeekStatus
