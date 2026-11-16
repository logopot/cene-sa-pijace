import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { LuMessageSquareText } from 'react-icons/lu'
import SEO from '../../components/SEO/SEO.jsx'
import { SITE_URL } from '../../constants/seo.js'
import { getFeedbackPath } from '../../constants/routeLocales.js'
import { trackEvent, trackPageEvent } from '../../utils/analytics.js'
import { withFallback } from '../../utils/feedbackText.js'
import {
  NAME_MAX,
  MESSAGE_MIN,
  MESSAGE_MAX,
  validateFeedback,
  sanitizeFromPath,
  pageTypeFromPath,
  textLength,
} from '../../utils/feedbackRules.js'
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
  Counter,
  FieldError,
  Honeypot,
  TurnstileSlot,
  FormError,
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
  const [searchParams] = useSearchParams()
  const from = sanitizeFromPath(searchParams.get('from') ?? '')
  const language = i18n.resolvedLanguage ?? i18n.language
  const tx = (key, vars) => withFallback(t, language, key, vars)

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('idle')
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const widgetIdRef = useRef(null)
  const slotRef = useRef(null)
  const successRef = useRef(null)
  const done = status === 'success'

  useEffect(() => {
    trackPageEvent('feedback_open', { from_page_type: pageTypeFromPath(from) })
  }, [from])

  // Explicit render: the widget is created here, once the script has loaded,
  // and removed again when the form goes away.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || done) return undefined
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !slotRef.current || widgetIdRef.current !== null) return
        widgetIdRef.current = turnstile.render(slotRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language,
          callback: (value) => setToken(value),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        })
      })
      .catch(() => {
        if (!cancelled) setFormError('feedback.errors.generic')
      })
    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [language, done])

  useEffect(() => {
    if (done) successRef.current?.focus()
  }, [done])

  const resetWidget = () => {
    setToken('')
    if (widgetIdRef.current !== null && window.turnstile) window.turnstile.reset(widgetIdRef.current)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status === 'sending') return

    const checked = validateFeedback({ name, message, path: from, lang: language })
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

    if (!TURNSTILE_SITE_KEY || !token) {
      setFormError(TURNSTILE_SITE_KEY ? 'feedback.errors.verification' : 'feedback.errors.generic')
      return
    }

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
        resetWidget()
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
      resetWidget()
      setStatus('idle')
    }
  }

  const messageLength = textLength(message)
  const sending = status === 'sending'

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
                onChange={(event) => setMessage(event.target.value)}
                required
                $invalid={Boolean(fieldErrors.message)}
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={`feedback-counter${fieldErrors.message ? ' feedback-message-error' : ''}`}
              />
              <Counter id="feedback-counter" $over={messageLength > MESSAGE_MAX}>
                {tx('feedback.counter', { count: messageLength, max: MESSAGE_MAX })}
              </Counter>
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

            <TurnstileSlot ref={slotRef} />

            <FormError $visible={Boolean(formError)} role="status" aria-live="polite">
              {formError ? tx(formError) : null}
            </FormError>

            <SubmitButton type="submit" disabled={sending} aria-busy={sending}>
              {sending ? tx('feedback.sending') : tx('feedback.submit')}
            </SubmitButton>
          </Form>
        )}

        <Notes>
          <Note>{tx('feedback.notePrivacy')}</Note>
          <Note>{tx('feedback.noteSources')}</Note>
        </Notes>
      </Page>
    </Container>
  )
}

export default Feedback
