import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LuLocateFixed, LuLoaderCircle } from 'react-icons/lu'
import { useLocationDetect } from '../../hooks/useLocationDetect.js'
import { Wrapper, DetectButton, StatusMessage } from './LocationDetectButton.styled.js'

const ERROR_MESSAGE_KEYS = {
  unsupported: 'locationDetect.unsupported',
  denied: 'locationDetect.denied',
  unavailable: 'locationDetect.unavailable',
  timeout: 'locationDetect.timeout',
  'no-match': 'locationDetect.noMatch',
}

// Auto-dismisses its own error message after a few seconds - this app has no
// app-wide toast system, so this stays a small, self-contained transient
// message instead of introducing one just for this button.
const MESSAGE_TIMEOUT_MS = 5000

function LocationDetectButton({ cities, onDetect, disabled }) {
  const { t } = useTranslation()
  const { status, errorReason, detect, reset } = useLocationDetect()

  useEffect(() => {
    if (status !== 'error') return undefined
    const timeoutId = setTimeout(reset, MESSAGE_TIMEOUT_MS)
    return () => clearTimeout(timeoutId)
  }, [status, reset])

  const handleClick = () => detect(cities, onDetect)

  return (
    <Wrapper>
      <DetectButton
        type="button"
        onClick={handleClick}
        disabled={disabled || status === 'locating'}
        aria-label={t('locationDetect.buttonLabel')}
        title={t('locationDetect.buttonLabel')}
      >
        {status === 'locating' ? <LuLoaderCircle className="spin" /> : <LuLocateFixed />}
      </DetectButton>
      {status === 'error' && <StatusMessage role="status">{t(ERROR_MESSAGE_KEYS[errorReason])}</StatusMessage>}
    </Wrapper>
  )
}

export default LocationDetectButton
