import { useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { Menu, Phone, X } from 'lucide-react'
import { buttonClass } from '#/components/ui/button'
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
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-navy-950 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 lg:hidden"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
      >
        <Menu className="size-5" aria-hidden="true" />
        {m.nav.menu}
      </button>

      <dialog
        ref={dialog}

        className={clsx(
          'mr-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none bg-white p-0 shadow-float',
          'backdrop:bg-navy-950/50 open:flex open:animate-slide-in open:flex-col motion-reduce:open:animate-none lg:hidden',
        )}
        aria-label={m.nav.menu}
        // Clicking the dimmed area outside the panel closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 pr-3 pl-5">
          <span className="font-heading text-[1.0625rem] font-bold whitespace-nowrap text-navy-950">
            {m.site.name}
          </span>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-semibold whitespace-nowrap text-navy-950 hover:bg-slate-50"
            onClick={close}
          >
            <X className="size-5" aria-hidden="true" />
            {m.nav.closeMenu}
          </button>
        </div>

        <nav
          aria-label={m.nav.label}
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          <ul className="list-none">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  onClick={close}
                  className="flex min-h-13 items-center rounded-lg px-3 font-heading text-xl font-semibold text-navy-950 hover:bg-blue-50 data-[status=active]:bg-blue-50 data-[status=active]:text-blue-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-3 border-t border-slate-200 p-5">
          <a
            href={EMERGENCY_PHONE.href}
            className={buttonClass('emergency', 'md', 'w-full')}
          >
            <Phone aria-hidden="true" />
            {fmt(m.emergency.callNumber, { number: EMERGENCY_PHONE.display })}
          </a>
          <p className="text-sm text-slate-500">
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
