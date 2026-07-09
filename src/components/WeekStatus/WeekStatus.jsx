import { useTranslation } from 'react-i18next'
import { LuBadgeCheck, LuArchive } from 'react-icons/lu'
import { StatusBadge } from './WeekStatus.styled.js'

function WeekStatus({ weekLabel, isFallbackWeek }) {
  const { t } = useTranslation()

  if (!weekLabel) return null

  if (isFallbackWeek) {
    return (
      <StatusBadge $archived>
        <LuArchive />
        {t('weekStatus.official', { week: weekLabel })}
      </StatusBadge>
    )
  }

  return (
    <StatusBadge>
      <LuBadgeCheck />
      {t('weekStatus.current', { week: weekLabel })}
    </StatusBadge>
  )
}

export default WeekStatus
