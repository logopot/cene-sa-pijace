import { Trans } from 'react-i18next'
import { LuBadgeCheck, LuArchive } from 'react-icons/lu'
import { StatusBadge } from './WeekStatus.styled.js'

// Keyed by the same Source-presence convention useProductAnalytics.js
// already uses to split STIPS vs JKP points (row.Source is only ever
// populated on JKP archive rows) - kept here so the badge's copy stays a
// simple lookup instead of another if/else branch.
const SOURCE_KEYS = {
  STIPS: 'weekStatus.stips',
  JKP: 'weekStatus.jkp',
}

function WeekStatus({ weekLabel, isFallbackWeek, source }) {
  if (!weekLabel) return null

  const i18nKey = SOURCE_KEYS[source] ?? SOURCE_KEYS.STIPS

  return (
    <StatusBadge $archived={isFallbackWeek}>
      {isFallbackWeek ? <LuArchive /> : <LuBadgeCheck />}
      <Trans i18nKey={i18nKey} values={{ value: weekLabel }} components={{ bold: <strong /> }} />
    </StatusBadge>
  )
}

export default WeekStatus
