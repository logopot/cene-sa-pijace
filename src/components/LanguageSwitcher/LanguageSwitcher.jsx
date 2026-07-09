import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { translatePathForLanguage } from '../../utils/localizedPath.js'
import FullScreenLoader from '../FullScreenLoader/FullScreenLoader.jsx'
import { TextSwitcher, LangTextButton, Separator } from './LanguageSwitcher.styled.js'

function LanguageSwitcher({ rows }) {
  const { i18n } = useTranslation()
  const location = useLocation()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Hard refresh (not client-side navigate) so every already-rendered string
  // on the page - not just the ones driven by props/params - reflects the
  // new language immediately, with no stale-translation flash. The loader
  // flips on before the redirect fires, covering the gap until the browser
  // actually unloads this page.
  const switchLanguage = async (targetLanguage) => {
    if (i18n.resolvedLanguage === targetLanguage) return
    setIsRedirecting(true)

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
      {isRedirecting && <FullScreenLoader />}
      <TextSwitcher>
        <LangTextButton
          type="button"
          $isActive={i18n.resolvedLanguage === 'sr'}
          onClick={() => switchLanguage('sr')}
        >
          sr
        </LangTextButton>
        <Separator aria-hidden="true">|</Separator>
        <LangTextButton
          type="button"
          $isActive={i18n.resolvedLanguage === 'en'}
          onClick={() => switchLanguage('en')}
        >
          en
        </LangTextButton>
      </TextSwitcher>
    </>
  )
}

export default LanguageSwitcher
