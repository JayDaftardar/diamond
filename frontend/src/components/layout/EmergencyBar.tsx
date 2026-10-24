import { clsx } from 'clsx'
import { Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

/**
 * Sticky red bar at the bottom of phone/tablet screens, in thumb reach, on every page.
 * Hidden on desktop, where the header carries the emergency button instead.
 *
 * When the footer (which lists all three numbers) comes into view, the bar slides away
 * so it never covers the footer's content.
 */
export function EmergencyBar() {
  const [away, setAway] = useState(false)

  useEffect(() => {
    const target = document.querySelector('[data-site-footer]')
    if (!target || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) =>
      setAway(entry.isIntersecting),
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <aside
      data-ui=""
      className={clsx(
        'fixed inset-x-0 bottom-0 z-50 flex min-h-[3.75rem] items-center justify-between gap-4 bg-red-600 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-white shadow-float sm:px-6 lg:hidden',
        'transition-transform duration-300 ease-smooth motion-reduce:transition-none',
        away && 'translate-y-[110%]',
      )}
      aria-label={m.emergency.barLabel}
      aria-hidden={away || undefined}
    >
      <span className="grid leading-tight font-bold">
        {m.emergency.label}
        <small className="text-[0.8125rem] font-semibold text-white/85">
          {m.emergency.open}
        </small>
      </span>
      <a
        href={EMERGENCY_PHONE.href}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 font-bold text-red-700 tabular-nums hover:bg-red-50 focus-visible:outline-white"
        tabIndex={away ? -1 : undefined}
      >
        <Phone className="size-4" aria-hidden="true" />
        {fmt(m.emergency.callNumber, { number: EMERGENCY_PHONE.display })}
      </a>
    </aside>
  )
}
