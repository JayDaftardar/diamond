import type { ReactNode } from 'react'
import { AlertIcon } from '#/components/Icon'

interface BaseProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
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
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          <AlertIcon />
          {error}
        </p>
      ) : null}
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
  },
) {
  const { id, value, onChange, maxLength, type = 'text', required } = props
  return (
    <FieldShell {...props}>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        required={required}
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
    <fieldset className="check-group">
      <legend>{legend}</legend>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <div className="check-group__items">{children}</div>
      {error ? (
        <p className="field__error">
          <AlertIcon />
          {error}
        </p>
      ) : null}
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
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  )
}
