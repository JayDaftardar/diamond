import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { CloseIcon, MenuIcon, PhoneIcon } from '#/components/Icon'
import { EMERGENCY_PHONE, PHONES } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import { NAV_LINKS } from './nav-links'

/**
 * Menu for phones and tablets. A native <dialog> opened with showModal() gives a focus
 * trap, Escape-to-close and an inert page behind it without extra code.
 */
export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = () => dialog.current?.close()

  return (
    <>
      <button
        type="button"
        className="menu-button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
      >
        <MenuIcon />
        {m.nav.menu}
      </button>

      <dialog
        ref={dialog}
        className="mobile-nav"
        aria-label={m.nav.menu}
        // Clicking the dimmed area outside the panel closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        <div className="mobile-nav__head">
          <span>{m.site.name}</span>
          <button type="button" className="menu-button" onClick={close}>
            <CloseIcon />
            {m.nav.closeMenu}
          </button>
        </div>

        <nav aria-label={m.nav.label}>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  onClick={close}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-nav__contact">
          <a
            href={EMERGENCY_PHONE.href}
            className="btn btn--emergency btn--block"
          >
            <PhoneIcon />
            {fmt(m.emergency.callNumber, { number: EMERGENCY_PHONE.display })}
          </a>
          <p className="small muted" style={{ margin: 0 }}>
            {m.hours.open24}.{' '}
            {PHONES.slice(1)
              .map((p) => p.display)
              .join(', ')}
          </p>
        </div>
      </dialog>
    </>
  )
}
