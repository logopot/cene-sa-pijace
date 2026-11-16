import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from 'react-bootstrap'
import { LuMessageSquareText } from 'react-icons/lu'
import SEO from '../../components/SEO/SEO.jsx'
import { SITE_URL } from '../../constants/seo.js'
import { getFeedbackPath } from '../../constants/routeLocales.js'
import { trackEvent, trackPageEvent } from '../../utils/analytics.js'
import { withFallback } from '../../utils/feedbackText.js'
import { getFormState } from '../../utils/feedbackFormState.js'
import { readLastRoute } from '../../utils/lastRoute.js'
import { NAME_MAX, MESSAGE_MIN, MESSAGE_MAX, validateFeedback, pageTypeFromPath } from '../../utils/feedbackRules.js'
import {
  Page,
  PageHeader,
  IconWrap,
  Title,
  Form,
  Field,
  Label,
  Input,
  Textarea,
  FieldMeta,
  Hint,
  Counter,
  FieldError,
  Honeypot,
  WidgetArea,
  TurnstileSlot,
  VerifyNote,
  FormError,
  RetryButton,
  SubmitButton,
  Success,
  SuccessTitle,
  SuccessText,
  Notes,
  Note,
} from './Feedback.styled.js'

// Public Turnstile key (the secret one only ever lives on the server).
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// The check starts this long after the message first becomes valid, so it does
// not begin on every keystroke around the 5-character mark.
const EXECUTE_DEBOUNCE_MS = 400

let turnstileLoading = null

// The Turnstile script is fetched only when this page asks for it, never for
// any other page of the site.
function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!turnstileLoading) {
    turnstileLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT
      script.async = true
      script.onload = () => resolve(window.turnstile)
      script.onerror = () => {
        turnstileLoading = null
        reject(new Error('turnstile failed to load'))
      }
      document.head.appendChild(script)
    })
  }
  return turnstileLoading
}

function Feedback() {
  const { t, i18n } = useTranslation()
  // The page the visitor was on before opening the form (see lastRoute.js);
  // empty after a direct visit.
  const [page] = useState(() => readLastRoute())
  const language = i18n.resolvedLanguage ?? i18n.language
  const tx = (key, vars) => withFallback(t, language, key, vars)

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [token, setToken] = useState('')
  // Turnstile check: idle | running | interactive | done | error (see feedbackFormState.js)
  const [verify, setVerify] = useState('idle')
  const [widgetReady, setWidgetReady] = useState(false)
  const [status, setStatus] = useState('idle')
  const [formError, setFormError] = useState(TURNSTILE_SITE_KEY ? '' : 'feedback.errors.generic')
  const [fieldErrors, setFieldErrors] = useState({})
  const widgetIdRef = useRef(null)
  const slotRef = useRef(null)
  const successRef = useRef(null)
  const done = status === 'success'
  const sending = status === 'sending'

  const form = getFormState({ message, hasToken: Boolean(token), verify, sending, widgetReady })

  useEffect(() => {
    trackPageEvent('feedback_open', { from_page_type: pageTypeFromPath(page) })
  }, [page])

  // Explicit render in "execute" mode: the widget is created here, once the
  // script has loaded, but stays invisible and idle until turnstile.execute is
  // called (below). Removed again when the form goes away.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || done) return undefined
    let cancelled = false
    const fail = () => {
      setToken('')
      setVerify('error')
      setFormError('feedback.errors.generic')
    }
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !slotRef.current || widgetIdRef.current !== null) return
        widgetIdRef.current = turnstile.render(slotRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          execution: 'execute',
          appearance: 'execute',
          // Fixed light look (not "auto"): the widget must not follow the
          // visitor's dark mode, the form around it is white.
          theme: 'light',
          size: 'normal',
          'refresh-expired': 'auto',
          language,
          callback: (value) => {
            setToken(value)
            setVerify('done')
            setFormError('')
          },
          'before-interactive-callback': () => setVerify('interactive'),
          // An expired token is dropped and the check starts over (the effect
          // below runs it again while the message is still valid).
          'expired-callback': () => {
            setToken('')
            if (window.turnstile && widgetIdRef.current !== null) window.turnstile.reset(widgetIdRef.current)
            setVerify('idle')
          },
          'error-callback': fail,
          'timeout-callback': fail,
        })
        setWidgetReady(true)
      })
      .catch(() => {
        if (!cancelled) fail()
      })
    return () => {
      cancelled = true
      setWidgetReady(false)
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [language, done])

  // The first time the message is valid (and again after a reset or an expiry
  // while it still is), start the check once, after a short pause.
  useEffect(() => {
    if (!form.shouldExecute) return undefined
    const timer = setTimeout(() => {
      if (widgetIdRef.current === null || !window.turnstile) return
      setVerify('running')
      window.turnstile.execute(widgetIdRef.current)
    }, EXECUTE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [form.shouldExecute])

  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  // Start over: a fresh, idle widget; the effect above runs the check again once
  // the message is valid.
  const restartVerification = () => {
    setToken('')
    setVerify('idle')
    if (widgetIdRef.current !== null && window.turnstile) window.turnstile.reset(widgetIdRef.current)
  }

  const handleMessageChange = (event) => {
    setMessage(event.target.value)
    // After a failed check, editing the message is a new attempt.
    if (verify === 'error') {
      setFormError('')
      restartVerification()
    }
  }

  const handleRetry = () => {
    setFormError('')
    restartVerification()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (sending || !form.canSubmit) return

    const checked = validateFeedback({ name, message, page, lang: language })
    if (!checked.ok) {
      const next = {}
      if (checked.errors.some((code) => code.startsWith('name_'))) next.name = 'feedback.errors.nameLong'
      if (checked.errors.includes('message_long')) next.message = 'feedback.errors.messageLong'
      else if (checked.errors.some((code) => code.startsWith('message_'))) next.message = 'feedback.errors.messageShort'
      setFieldErrors(next)
      setFormError('')
      return
    }
    setFieldErrors({})

    setStatus('sending')
    setFormError('')
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...checked.value, website, token }),
      })
      if (!response.ok) {
        setFormError(response.status === 429 ? 'feedback.errors.tooMany' : 'feedback.errors.generic')
        restartVerification()
        setStatus('idle')
        return
      }
      // Counts only a real submission (a filled honeypot is a bot the server
      // quietly discarded). Nothing the visitor wrote goes into the event.
      if (website === '') trackEvent('feedback_submit')
      setName('')
      setMessage('')
      setStatus('success')
    } catch {
      // Network failure: the input stays exactly as typed.
      setFormError('feedback.errors.generic')
      restartVerification()
      setStatus('idle')
    }
  }

  return (
    <Container>
      <SEO
        title={`${tx('feedback.title')} | ${t('app.name')}`}
        description={tx('feedback.seoDescription')}
        url={`${SITE_URL}${getFeedbackPath(language)}`}
        noindex
      />
      <Page>
        <PageHeader>
          <IconWrap>
            <LuMessageSquareText />
          </IconWrap>
          <Title>{tx('feedback.title')}</Title>
        </PageHeader>

        <Notes>
          <Note>{tx('feedback.notePrivacy')}</Note>
          <Note>{tx('feedback.noteSources')}</Note>
        </Notes>

        {done ? (
          <Success ref={successRef} tabIndex={-1} role="status">
            <SuccessTitle>{tx('feedback.successTitle')}</SuccessTitle>
            <SuccessText>{tx('feedback.successBody')}</SuccessText>
          </Success>
        ) : (
          <Form onSubmit={handleSubmit} noValidate>
            <Field>
              <Label htmlFor="feedback-name">{tx('feedback.nameLabel')}</Label>
              <Input
                id="feedback-name"
                name="name"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(event) => setName(event.target.value)}
                $invalid={Boolean(fieldErrors.name)}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'feedback-name-error' : undefined}
              />
              {fieldErrors.name && (
                <FieldError id="feedback-name-error">{tx(fieldErrors.name, { max: NAME_MAX })}</FieldError>
              )}
            </Field>

            <Field>
              <Label htmlFor="feedback-message">{tx('feedback.messageLabel')}</Label>
              <Textarea
                id="feedback-message"
                name="message"
                value={message}
                onChange={handleMessageChange}
                required
                $invalid={Boolean(fieldErrors.message)}
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={`feedback-hint feedback-counter${fieldErrors.message ? ' feedback-message-error' : ''}`}
              />
              <FieldMeta>
                <Hint id="feedback-hint">{tx('feedback.minHint', { min: MESSAGE_MIN })}</Hint>
                <Counter id="feedback-counter" $over={form.length > MESSAGE_MAX}>
                  {tx('feedback.counter', { count: form.length, max: MESSAGE_MAX })}
                </Counter>
              </FieldMeta>
              {fieldErrors.message && (
                <FieldError id="feedback-message-error">
                  {tx(fieldErrors.message, { min: MESSAGE_MIN, max: MESSAGE_MAX })}
                </FieldError>
              )}
            </Field>

            <Honeypot aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </Honeypot>

            {/* Empty and invisible until the check has been started; it has no
                height of its own, so it takes no room until Cloudflare shows
                something (the success tick, or a box asking for a click). */}
            <WidgetArea $visible={form.showWidget}>
              <TurnstileSlot ref={slotRef} />
            </WidgetArea>

            <VerifyNote role="status" aria-live="polite">
              {form.verifying ? tx('feedback.verifying') : null}
            </VerifyNote>

            <FormError $visible={Boolean(formError)} role="status" aria-live="polite">
              {formError ? tx(formError) : null}
            </FormError>

            {form.showRetry && (
              <RetryButton type="button" onClick={handleRetry}>
                {tx('feedback.retry')}
              </RetryButton>
            )}

            <SubmitButton type="submit" disabled={!form.canSubmit} aria-busy={sending}>
              {sending ? tx('feedback.sending') : tx('feedback.submit')}
            </SubmitButton>
          </Form>
        )}
      </Page>
    </Container>
  )
}

export default Feedback
