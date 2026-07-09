import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuApple, LuBanana, LuCarrot, LuCherry } from 'react-icons/lu'
import { Overlay, IconWrap, ProgressText, PhaseText } from './FullScreenLoader.styled.js'

const ICONS = [LuCarrot, LuApple, LuCherry, LuBanana]
const PHASE_KEYS = ['loader.phase1', 'loader.phase2', 'loader.phase3', 'loader.phase4']

// A full 0-100 chase takes ~1.5s (100 steps * 15ms), matching the "premium,
// unhurried" pace requested rather than snapping instantly to each new
// realProgress value.
const VISUAL_STEP = 1
const VISUAL_INTERVAL_MS = 15

function getPhaseIndex(progress) {
  if (progress <= 25) return 0
  if (progress <= 50) return 1
  if (progress <= 75) return 2
  return 3
}

// realProgress is the true, signal-driven boot percentage from the app
// lifecycle (see App.jsx's getInitializationProgress) - it defaults to 0 here
// only because main.jsx also renders this as a static Suspense fallback,
// which has no lifecycle step to report. visualProgress is a purely cosmetic
// animation layer that chases realProgress at a fixed smooth rate, so the
// loader never snaps instantly when a boot step resolves and never stalls
// when realProgress jumps ahead - it just catches up over successive ticks.
// onComplete fires once, the moment visualProgress itself reaches 100, so the
// parent can gate unmounting on the *visual* finish rather than the raw
// (possibly instant) realProgress value.
function FullScreenLoader({ realProgress = 0, onComplete }) {
  // useSuspense: false - this component doubles as the app's Suspense
  // fallback (see main.jsx) while i18n resources are still loading, so its
  // own t() call must never itself trigger a suspend.
  const { t } = useTranslation('translation', { useSuspense: false })
  const [visualProgress, setVisualProgress] = useState(0)

  const target = Math.min(100, Math.max(0, realProgress))

  useEffect(() => {
    const timer = setInterval(() => {
      setVisualProgress((prev) => (prev < target ? Math.min(target, prev + VISUAL_STEP) : prev))
    }, VISUAL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [target])

  useEffect(() => {
    if (visualProgress === 100) onComplete?.()
  }, [visualProgress, onComplete])

  const phaseIndex = getPhaseIndex(visualProgress)
  const ActiveIcon = ICONS[phaseIndex]

  return (
    <Overlay>
      <IconWrap key={phaseIndex}>
        <ActiveIcon aria-hidden="true" />
      </IconWrap>
      <ProgressText aria-hidden="true">{visualProgress}%</ProgressText>
      <PhaseText role="status" aria-live="polite">
        {t(PHASE_KEYS[phaseIndex])}
      </PhaseText>
    </Overlay>
  )
}

export default FullScreenLoader
