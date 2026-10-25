import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { buttonClass } from '#/components/ui/button'
import { fieldControl } from '#/components/ui/field'
import { FieldError } from './Fields'
import { fmt, m } from '#/lib/i18n'

/**
 * A list of links, one box each, with "Add another" for one more box and Remove on each.
 * Empty boxes are fine: the server drops them. Errors come back by position
 * (`{name}.0`, `{name}.1`, ...) and are shown next to the box they belong to.
 */
export function LinkList({
  id,
  name,
  legend,
  hint,
  slotLabel,
  addLabel,
  values,
  onChange,
  errors,
  max,
  maxLength,
}: {
  id: string
  /** The API field, used to find this list's errors. */
  name: string
  legend: string
  hint: string
  /** Label for one box, with {n} for its number. */
  slotLabel: string
  addLabel: string
  values: Array<string>
  onChange: (values: Array<string>) => void
  errors: Record<string, string>
  max: number
  maxLength: number
}) {
  const t = m.admin.treatments
  // Stable keys, so typing in one box never jumps into another after a removal.
  const nextKey = useRef(values.length)
  const [keys, setKeys] = useState(() => values.map((_, index) => index))
  // Errors refer to positions at the last save; after adding or removing they no longer line up.
  const [staleErrors, setStaleErrors] = useState<Record<string, string> | null>(
    null,
  )
  const [focusLast, setFocusLast] = useState(false)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!focusLast) return
    list.current
      ?.querySelector<HTMLInputElement>('li:last-child input')
      ?.focus()
    setFocusLast(false)
  }, [focusLast])

  const slotErrors = staleErrors === errors ? {} : errors
  const ownSlotError = values.some(
    (_, index) => `${name}.${index}` in slotErrors,
  )
  const listError = ownSlotError ? undefined : errors[name]

  function add() {
    onChange([...values, ''])
    setKeys([...keys, nextKey.current++])
    setStaleErrors(errors)
    setFocusLast(true)
  }

  function remove(index: number) {
    if (values.length === 1) {
      onChange(['']) // keep one empty box rather than none
    } else {
      onChange(values.filter((_, i) => i !== index))
      setKeys(keys.filter((_, i) => i !== index))
    }
    setStaleErrors(errors)
  }

  return (
    <fieldset className="grid min-w-0 justify-items-start gap-3 border-0 p-0">
      <legend className="mb-1 p-0 font-semibold text-navy-950">{legend}</legend>
      <p className="text-[0.9375rem] text-slate-700" id={`${id}-hint`}>
        {fmt(hint, { max: String(max) })}
      </p>
      <ol className="grid w-full list-none gap-3" ref={list}>
        {values.map((value, index) => {
          const slotId = `${id}-${keys[index]}`
          const label = fmt(slotLabel, { n: String(index + 1) })
          const error = slotErrors[`${name}.${index}`]
          return (
            <li key={keys[index]} className="grid min-w-0 gap-2">
              <label htmlFor={slotId} className="sr-only">
                {label}
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  id={slotId}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={value}
                  maxLength={maxLength}
                  className={`${fieldControl} h-12 min-w-0 flex-1`}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${slotId}-error` : `${id}-hint`}
                  onChange={(event) =>
                    onChange(
                      values.map((current, i) =>
                        i === index ? event.target.value : current,
                      ),
                    )
                  }
                />
                {values.length > 1 || value ? (
                  <button
                    type="button"
                    className={buttonClass('quiet', 'sm', 'h-12 shrink-0')}
                    aria-label={fmt(t.removeSlotLabel, { label })}
                    onClick={() => remove(index)}
                  >
                    {t.removeSlot}
                  </button>
                ) : null}
              </div>
              {error ? (
                <FieldError id={`${slotId}-error`}>{error}</FieldError>
              ) : null}
            </li>
          )
        })}
      </ol>
      {listError ? <FieldError>{listError}</FieldError> : null}
      {values.length < max ? (
        <button
          type="button"
          className={buttonClass('quiet', 'sm')}
          onClick={add}
        >
          <Plus aria-hidden="true" />
          {addLabel}
        </button>
      ) : null}
    </fieldset>
  )
}
