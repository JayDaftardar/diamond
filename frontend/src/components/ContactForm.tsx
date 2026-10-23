import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertIcon } from '#/components/Icon'
import { API_PUBLIC_URL, EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

type Field = 'name' | 'phone' | 'email' | 'message'
type FieldErrors = Partial<Record<Field, string>>
type Status = 'idle' | 'submitting' | 'success' | 'error'

const FIELDS: Field[] = ['name', 'phone', 'email', 'message']
const CONTACT_URL = `${API_PUBLIC_URL}/api/v1/public/contact`
const phoneVars = { number: EMERGENCY_PHONE.display }

/**
 * Contact form with idle, sending, success and error states.
 *
 * Spam guards (the server enforces them): a hidden "website" field that people never see,
 * a signed timestamp token fetched when the page loads (a submission faster than a person
 * can type is dropped), and a rate limit. Error text comes from content/en.ts, never from
 * the server, so it can be translated.
 */
export function ContactForm() {
  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    website: '',
  })
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const errorBox = useRef<HTMLDivElement>(null)
  const successBox = useRef<HTMLDivElement>(null)

  async function loadToken() {
    try {
      const response = await fetch(`${CONTACT_URL}/token`, {
        cache: 'no-store',
      })
      const data = (await response.json()) as { token: string }
      setToken(data.token)
      return data.token
    } catch {
      return ''
    }
  }

  // The token is issued when the page loads; that starts the "too fast" timer.
  useEffect(() => {
    void loadToken()
  }, [])

  // Move focus to the result so screen-reader and keyboard users notice it.
  useEffect(() => {
    if (status === 'error') errorBox.current?.focus()
    if (status === 'success') successBox.current?.focus()
  }, [status])

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    if (field in fieldErrors) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setStatus('submitting')
    setFormError('')
    setFieldErrors({})

    try {
      const currentToken = token || (await loadToken())
      const response = await fetch(CONTACT_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, token: currentToken }),
      })

      if (response.ok) {
        setStatus('success')
        return
      }

      if (response.status === 422) {
        const body = (await response.json()) as {
          errors?: Record<string, string>
        }
        const errors: FieldErrors = {}
        for (const field of FIELDS) {
          if (body.errors?.[field]) errors[field] = m.contact.fieldErrors[field]
        }
        setFieldErrors(errors)
        setFormError(m.contact.errorSummary)
      } else if (response.status === 429) {
        setFormError(fmt(m.contact.errorRate, phoneVars))
      } else if (response.status === 400) {
        await loadToken() // the form had timed out; get a fresh timestamp
        setFormError(m.contact.errorExpired)
      } else {
        setFormError(fmt(m.contact.errorGeneric, phoneVars))
      }
      setStatus('error')
    } catch {
      setFormError(m.contact.errorNetwork)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="form-result" ref={successBox} tabIndex={-1} role="status">
        <h2>{m.contact.successTitle}</h2>
        <p>{fmt(m.contact.successBody, phoneVars)}</p>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => {
            setValues({
              name: '',
              phone: '',
              email: '',
              message: '',
              website: '',
            })
            setStatus('idle')
            void loadToken()
          }}
        >
          {m.contact.sendAnother}
        </button>
      </div>
    )
  }

  const busy = status === 'submitting'

  return (
    <form className="contact-form stack" onSubmit={submit} noValidate>
      {status === 'error' ? (
        <div className="form-alert" ref={errorBox} tabIndex={-1} role="alert">
          <AlertIcon />
          <div>
            <strong>{m.contact.errorTitle}</strong>
            <p>{formError}</p>
          </div>
        </div>
      ) : null}

      <TextField
        field="name"
        label={m.contact.name}
        value={values.name}
        error={fieldErrors.name}
        onChange={update}
        autoComplete="name"
        required
      />
      <TextField
        field="phone"
        label={m.contact.phone}
        hint={m.contact.phoneHint}
        value={values.phone}
        error={fieldErrors.phone}
        onChange={update}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
      />
      <TextField
        field="email"
        label={m.contact.email}
        value={values.email}
        error={fieldErrors.email}
        onChange={update}
        type="email"
        autoComplete="email"
      />
      <TextField
        field="message"
        label={m.contact.message}
        value={values.message}
        error={fieldErrors.message}
        onChange={update}
        multiline
        required
      />

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update('website', event.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? m.contact.sending : m.contact.send}
      </button>
    </form>
  )
}

interface TextFieldProps {
  field: Field
  label: string
  value: string
  error?: string
  hint?: string
  multiline?: boolean
  required?: boolean
  type?: string
  inputMode?: 'numeric'
  autoComplete?: string
  onChange: (field: Field, value: string) => void
}

function TextField({
  field,
  label,
  value,
  error,
  hint,
  multiline,
  required,
  type = 'text',
  inputMode,
  autoComplete,
  onChange,
}: TextFieldProps) {
  const id = `contact-${field}`
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined
  const common = {
    id,
    name: field,
    value,
    required,
    autoComplete,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  } as const

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {multiline ? (
        <textarea
          {...common}
          rows={6}
          maxLength={2000}
          onChange={(event) => onChange(field, event.target.value)}
        />
      ) : (
        <input
          {...common}
          type={type}
          inputMode={inputMode}
          maxLength={254}
          onChange={(event) => onChange(field, event.target.value)}
        />
      )}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          <AlertIcon />
          {error}
        </p>
      ) : null}
    </div>
  )
}
