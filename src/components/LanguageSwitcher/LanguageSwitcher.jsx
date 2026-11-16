import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { trackEvent } from '../../utils/analytics.js'
import { translatePathForLanguage } from '../../utils/localizedPath.js'
import { getRouteLanguage } from '../../constants/routeLocales.js'
import { TextSwitcher, LangTextButton, Separator } from './LanguageSwitcher.styled.js'

// The saved choice read by the language detector (src/i18n.js) for paths that
// have no language of their own. Storage may be blocked: then it just isn't saved.
function saveLanguageChoice(language) {
  try {
    window.localStorage.setItem('i18nextLng', language)
  } catch {
    // Storage unavailable: the choice lasts for this page load only.
  }
}

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

    // An address written in a language (/city/..., /grad/..., /feedback, ...) is
    // switched by going to its pair in the other language; that address's own
    // language then shows, and nothing is saved. Only a path with no language of
    // its own (the homepage) switches in place and remembers the choice.
    if (getRouteLanguage(location.pathname)) {
      const translatedPath = translatePathForLanguage(location.pathname, rows, targetLanguage)
      // No pair for this address: the other language's homepage, with the choice saved.
      if (!translatedPath) saveLanguageChoice(targetLanguage)
      window.location.href = translatedPath ?? '/'
      return
    }
    saveLanguageChoice(targetLanguage)
    await i18n.changeLanguage(targetLanguage)
    window.location.reload()
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
