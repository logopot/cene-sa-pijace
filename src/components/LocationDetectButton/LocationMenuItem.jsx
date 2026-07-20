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

// Auto-dismisses its own error message after a few seconds, same convention
// as LocationDetectButton.jsx (no app-wide toast system to hook into).
const MESSAGE_TIMEOUT_MS = 5000

// First row inside the desktop Grad segment's dropdown menu (see
// FilterBar.jsx's leadingAction) - same detect flow as the standalone
// LocationDetectButton, just rendered as a menu action instead of an
// external icon button. onSelect is CustomDropdown's own handleSelect, so a
// successful detect both applies the city and closes the menu exactly like
// clicking a normal option would.
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
