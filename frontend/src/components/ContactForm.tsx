import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { buttonClass } from '#/components/ui/button'
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
      <div
        className="grid gap-4 rounded-2xl bg-white p-6 shadow-tile ring-1 ring-slate-200/70 focus:outline-none sm:p-8"
        ref={successBox}
        tabIndex={-1}
        role="status"
      >
        <CircleCheck className="size-9 text-blue-600" aria-hidden="true" />
        <h2 className="font-heading text-2xl font-semibold text-navy-950">
          {m.contact.successTitle}
        </h2>
        <p className="text-lead text-slate-700">
          {fmt(m.contact.successBody, phoneVars)}
        </p>
        <div>
          <button
            type="button"
            className={buttonClass('soft')}
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
      </div>
    )
  }

  const busy = status === 'submitting'

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {status === 'error' ? (
        <div
          className="flex gap-3 rounded-xl bg-red-50 p-4 text-red-700 ring-1 ring-red-600/30 focus:outline-none"
          ref={errorBox}
          tabIndex={-1}
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="block font-semibold">
              {m.contact.errorTitle}
            </strong>
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
      <div
        className="absolute -left-[9999px] size-px overflow-hidden"
        aria-hidden="true"
      >
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

      <div>
        <button
          type="submit"
          className={buttonClass('primary', 'md', 'w-full sm:w-auto')}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? m.contact.sending : m.contact.send}
        </button>
      </div>
    </form>
  )
}

const control =
  'w-full rounded-lg border-0 bg-white px-4 text-[1.0625rem] text-navy-950 ring-1 ring-slate-300 transition placeholder:text-slate-500 hover:ring-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-600'

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
    <div className="grid gap-2">
      <label htmlFor={id} className="font-semibold text-navy-950">
        {label}
      </label>
      {hint ? (
        <span className="text-[0.9375rem] text-slate-500" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {multiline ? (
        <textarea
          {...common}
          rows={6}
          maxLength={2000}
          className={`${control} min-h-40 resize-y py-3`}
          onChange={(event) => onChange(field, event.target.value)}
        />
      ) : (
        <input
          {...common}
          type={type}
          inputMode={inputMode}
          maxLength={254}
          className={`${control} h-12`}
          onChange={(event) => onChange(field, event.target.value)}
        />
      )}
      {error ? (
        <p
          className="flex items-start gap-2 text-[0.9375rem] font-semibold text-red-600"
          id={`${id}-error`}
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  )
}
