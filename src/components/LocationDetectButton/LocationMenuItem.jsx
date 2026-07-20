import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LuLocateFixed, LuLoaderCircle } from 'react-icons/lu'
import { useLocationDetect } from '../../hooks/useLocationDetect.js'
import { ActionWrapper, ActionButton, ActionStatus, ActionDivider } from './LocationMenuItem.styled.js'

const ERROR_MESSAGE_KEYS = {
  unsupported: 'locationDetect.unsupported',
  denied: 'locationDetect.denied',
  unavailable: 'locationDetect.unavailable',
  timeout: 'locationDetect.timeout',
  'no-match': 'locationDetect.noMatch',
}

// Auto-dismisses its own error message after a few seconds - this app has no
// app-wide toast system, so this stays a small, self-contained transient
// message.
const MESSAGE_TIMEOUT_MS = 5000

// First row inside the Grad section's option list, shared by both the
// desktop segmented bar (FilterBar.jsx's leadingAction, passed to
// CustomDropdown) and the mobile accordion drawer
// (MobileFilterDrawer.jsx). onSelect is whatever the caller wants to happen
// on a successful detect - CustomDropdown's own handleSelect on desktop
// (applies the city and closes the dropdown), or MobileFilterDrawer's
// handleGradSelect on mobile (applies the city and collapses the Grad row).
function LocationMenuItem({ cities, onSelect }) {
  const { t } = useTranslation()
  const { status, errorReason, detect, reset } = useLocationDetect()

  useEffect(() => {
    if (status !== 'error') return undefined
    const timeoutId = setTimeout(reset, MESSAGE_TIMEOUT_MS)
    return () => clearTimeout(timeoutId)
  }, [status, reset])

  const handleClick = () => detect(cities, onSelect)

  return (
    <ActionWrapper>
      <ActionButton type="button" onClick={handleClick} disabled={status === 'locating'}>
        {status === 'locating' ? <LuLoaderCircle className="spin" /> : <LuLocateFixed />}
        {t('locationDetect.menuLabel')}
      </ActionButton>
      {status === 'error' && <ActionStatus role="status">{t(ERROR_MESSAGE_KEYS[errorReason])}</ActionStatus>}
      <ActionDivider aria-hidden="true" />
    </ActionWrapper>
  )
}

export default LocationMenuItem
