import { useCallback, useState } from 'react'
import { findNearestCity } from '../utils/geolocation.js'

// A cached fix up to 5 minutes old is fine for city-level (not turn-by-turn)
// detection, and enableHighAccuracy:false keeps this to cheap network/wifi
// positioning instead of forcing a slow, battery-heavy GPS fix.
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 5 * 60 * 1000,
}

// Wraps navigator.geolocation + findNearestCity behind one imperative
// detect(availableCities, onFound) call, so the triggering component (see
// LocationMenuItem.jsx) only ever has to render off `status`/`errorReason`.
export function useLocationDetect() {
  const [status, setStatus] = useState('idle') // 'idle' | 'locating' | 'success' | 'error'
  const [errorReason, setErrorReason] = useState(null) // 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'no-match'

  const detect = useCallback((availableCities, onFound) => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setErrorReason('unsupported')
      return
    }

    setStatus('locating')
    setErrorReason(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestCity(position.coords.latitude, position.coords.longitude, availableCities)
        if (!nearest) {
          setStatus('error')
          setErrorReason('no-match')
          return
        }
        setStatus('success')
        onFound(nearest.grad)
      },
      (error) => {
        setStatus('error')
        if (error.code === error.PERMISSION_DENIED) setErrorReason('denied')
        else if (error.code === error.TIMEOUT) setErrorReason('timeout')
        else setErrorReason('unavailable')
      },
      GEOLOCATION_OPTIONS,
    )
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorReason(null)
  }, [])

  return { status, errorReason, detect, reset }
}
