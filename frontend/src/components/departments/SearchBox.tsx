import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { m } from '#/lib/i18n'

/**
 * Search across every treatment. Results live at /departments?q=...
 *
 * `live` is true on /departments itself: results update as the visitor types (debounced,
 * replacing the history entry so Back isn't flooded). On a department page, typing would
 * navigate away and lose focus, so there the search runs when the visitor submits.
 */
export function SearchBox({ q, live }: { q: string; live: boolean }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(q)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Keep the box in step when the address changes (Clear, Back, a shared link).
  useEffect(() => setValue(q), [q])
  useEffect(() => () => clearTimeout(timer.current), [])

  function go(next: string, replace: boolean) {
    const trimmed = next.trim()
    void navigate({
      to: '/departments',
      search: trimmed ? { q: trimmed } : {},
      replace,
      resetScroll: false,
    })
  }

  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        clearTimeout(timer.current)
        go(value, false)
      }}
    >
      <label htmlFor="treatment-search" className="visually-hidden">
        {m.departments.searchLabel}
      </label>
      <input
        id="treatment-search"
        type="search"
        name="q"
        value={value}
        maxLength={100}
        autoComplete="off"
        placeholder={m.departments.searchPlaceholder}
        onChange={(event) => {
          setValue(event.target.value)
          if (live) {
            clearTimeout(timer.current)
            timer.current = setTimeout(() => go(event.target.value, true), 350)
          }
        }}
      />
      <button type="submit" className="btn btn--primary">
        {m.departments.searchButton}
      </button>
    </form>
  )
}
