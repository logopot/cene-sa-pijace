import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '../../utils/analytics.js'
import { translatePathForLanguage } from '../../utils/localizedPath.js'
import { TextSwitcher, LangTextButton, Separator } from './LanguageSwitcher.styled.js'

function LanguageSwitcher({ rows }) {
  const { i18n } = useTranslation()
  const location = useLocation()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Hard refresh (not client-side navigate) so every already-rendered string
  // on the page - not just the ones driven by props/params - reflects the
  // new language immediately, with no stale-translation flash. The switch
  // buttons stay disabled once a switch has started, covering the gap until
  // the browser actually unloads this page.
  const switchLanguage = async (targetLanguage) => {
    if (i18n.resolvedLanguage === targetLanguage) return
    setIsRedirecting(true)
    trackEvent('language_switch', { from: i18n.resolvedLanguage, to: targetLanguage })

    const translatedPath = translatePathForLanguage(location.pathname, rows, targetLanguage)
    await i18n.changeLanguage(targetLanguage)

    if (translatedPath) {
      window.location.href = translatedPath
    } else {
      window.location.reload()
    }
  }

  return (
    <>
      <TextSwitcher>
        <LangTextButton
          type="button"
          $isActive={i18n.resolvedLanguage === 'sr'}
          disabled={isRedirecting}
          onClick={() => switchLanguage('sr')}
        >
          sr
        </LangTextButton>
        <Separator aria-hidden="true">|</Separator>
        <LangTextButton
          type="button"
          $isActive={i18n.resolvedLanguage === 'en'}
          disabled={isRedirecting}
          onClick={() => switchLanguage('en')}
        >
          en
        </LangTextButton>
      </TextSwitcher>
    </>
  )
}

export default LanguageSwitcher
