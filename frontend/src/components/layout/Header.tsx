import { Link } from '@tanstack/react-router'
import { PhoneIcon } from '#/components/Icon'
import { EMERGENCY_PHONE } from '#/content/config'
import { m } from '#/lib/i18n'
import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { NAV_LINKS } from './nav-links'

/**
 * Sticky header. On desktop the emergency number is a red button at the right; on phones
 * and tablets the red EmergencyBar at the bottom of the screen does that job.
 */
export function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__row">
        <Logo />

        <nav className="site-nav" aria-label={m.nav.label}>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} activeOptions={{ exact: link.exact }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={EMERGENCY_PHONE.href}
          className="btn btn--emergency site-header__call"
        >
          <PhoneIcon />
          <span className="call-label">
            <small>{m.emergency.headerLabel}</small>
            <span className="tel">{EMERGENCY_PHONE.display}</span>
          </span>
        </a>

        <MobileNav />
      </div>
    </header>
  )
}
