import { useTranslation } from 'react-i18next'
import { LuBadgeCheck, LuArchive } from 'react-icons/lu'
import { StatusBadge, TextGroup, SourceName, DateMeta } from './WeekStatus.styled.js'

// Keyed by the same Source-presence convention useProductAnalytics.js
// already uses to split STIPS vs JKP points (row.Source is only ever
// populated on JKP archive rows) - kept here so the badge's copy stays a
// simple lookup instead of another if/else branch.
const SOURCE_KEYS = {
  STIPS: 'weekStatus.stips',
  JKP: 'weekStatus.jkp',
}

function WeekStatus({ weekLabel, isFallbackWeek, source }) {
  const { t } = useTranslation()
  if (!weekLabel) return null

  const sourceKey = SOURCE_KEYS[source] ?? SOURCE_KEYS.STIPS

  return (
    <StatusBadge $archived={isFallbackWeek}>
      {isFallbackWeek ? <LuArchive /> : <LuBadgeCheck />}
      <TextGroup>
        <SourceName>{t(sourceKey)}</SourceName>
        <DateMeta>{t('weekStatus.dateRange', { value: weekLabel })}</DateMeta>
      </TextGroup>
    </StatusBadge>
  )
}

export default WeekStatus
