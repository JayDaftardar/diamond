import { useEffect, useState } from 'react'
import { PhoneIcon } from '#/components/Icon'
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
    const target = document.querySelector('.site-footer')
    if (!target || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) =>
      setAway(entry.isIntersecting),
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <aside
      className={`emergency-bar${away ? ' is-away' : ''}`}
      aria-label={m.emergency.barLabel}
      aria-hidden={away || undefined}
    >
      <span className="emergency-bar__text">
        {m.emergency.label}
        <small>{m.emergency.open}</small>
      </span>
      <a
        href={EMERGENCY_PHONE.href}
        className="btn"
        tabIndex={away ? -1 : undefined}
      >
        <PhoneIcon />
        {fmt(m.emergency.callNumber, { number: EMERGENCY_PHONE.display })}
      </a>
    </aside>
  )
}
