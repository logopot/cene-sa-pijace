import { useTranslation } from 'react-i18next'
import { loadFailureDefault } from '../../constants/loadFailureText.js'
import { Box, Message, ReloadButton } from './LoadFailure.styled.js'

// Shown instead of a spinner that would never end: a page chunk could not be loaded
// (an old tab after a deploy, a dropped connection) or loading takes far too long.
function LoadFailure() {
  const { t, i18n } = useTranslation()
  const text = (key) => t(key, { defaultValue: loadFailureDefault(i18n.language, key) })

  return (
    <Box role="alert">
      <Message>{text('loadFailure.message')}</Message>
      <ReloadButton type="button" onClick={() => window.location.reload()}>
        {text('loadFailure.reload')}
      </ReloadButton>
    </Box>
  )
}

export default LoadFailure
