import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { checkboxControl, fieldControl } from '#/components/ui/field'

interface BaseProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
}

const labelClass = 'font-semibold text-navy-950'
const hintClass = 'text-[0.9375rem] text-slate-700'

/** A field's own error message, in red with an icon (never colour alone). */
export function FieldError({
  id,
  children,
}: {
  id?: string
  children: ReactNode
}) {
  return (
    <p
      className="flex items-start gap-2 text-[0.9375rem] font-semibold text-red-700"
      id={id}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

/** Label, optional hint, the control, and the field's own error message. */
function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: BaseProps & { children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {hint ? (
        <span className={hintClass} id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  )
}

function describedBy({ id, hint, error }: BaseProps) {
  return (
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined
  )
}

export function TextField(
  props: BaseProps & {
    value: string
    onChange: (value: string) => void
    maxLength?: number
    type?: string
    autoComplete?: string
  },
) {
  const {
    id,
    value,
    onChange,
    maxLength,
    type = 'text',
    required,
    autoComplete,
  } = props
  return (
    <FieldShell {...props}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
        autoComplete={autoComplete}
        className={`${fieldControl} h-12`}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy(props)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

export function TextAreaField(
  props: BaseProps & {
    value: string
    onChange: (value: string) => void
    rows?: number
    maxLength?: number
  },
) {
  const { id, value, onChange, rows = 4, maxLength, required } = props
  return (
    <FieldShell {...props}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        className={`${fieldControl} resize-y py-3`}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy(props)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

export function SelectField(
  props: BaseProps & {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  },
) {
  const { id, value, onChange, options, required } = props
  return (
    <FieldShell {...props}>
      <select
        id={id}
        value={value}
        required={required}
        className={`${fieldControl} h-12 cursor-pointer`}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy(props)}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

/** A group of checkboxes (or a single one) inside a fieldset. */
export function CheckGroup({
  legend,
  hint,
  error,
  children,
}: {
  legend: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <fieldset className="grid min-w-0 gap-2 border-0 p-0">
      <legend className={`${labelClass} mb-1 p-0`}>{legend}</legend>
      {hint ? <p className={hintClass}>{hint}</p> : null}
      <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">{children}</div>
      {error ? <FieldError>{error}</FieldError> : null}
    </fieldset>
  )
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-slate-700">
      <input
        type="checkbox"
        className={checkboxControl}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
