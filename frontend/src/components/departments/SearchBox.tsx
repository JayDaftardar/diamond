import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { buttonClass } from '#/components/ui/button'
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
      className="flex max-w-2xl gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        clearTimeout(timer.current)
        go(value, false)
      }}
    >
      <label htmlFor="treatment-search" className="sr-only">
        {m.departments.searchLabel}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          id="treatment-search"
          type="search"
          name="q"
          value={value}
          maxLength={100}
          autoComplete="off"
          placeholder={m.departments.searchPlaceholder}
          className="h-12 w-full rounded-lg border-0 bg-white pr-4 pl-12 text-[1.0625rem] text-navy-950 shadow-tile ring-1 ring-slate-300 transition placeholder:text-slate-500 hover:ring-slate-500 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          onChange={(event) => {
            setValue(event.target.value)
            if (live) {
              clearTimeout(timer.current)
              timer.current = setTimeout(
                () => go(event.target.value, true),
                350,
              )
            }
          }}
        />
      </div>
      <button type="submit" className={buttonClass('primary')}>
        {m.departments.searchButton}
      </button>
    </form>
  )
}
