import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuArrowUp } from 'react-icons/lu'
import { FloatingButton } from './ScrollToTopButton.styled.js'

const SHOW_THRESHOLD = 400

function ScrollToTopButton() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SHOW_THRESHOLD)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <FloatingButton type="button" onClick={handleClick} $visible={visible} aria-label={t('scrollToTop.label')}>
      <LuArrowUp />
    </FloatingButton>
  )
}

export default ScrollToTopButton
