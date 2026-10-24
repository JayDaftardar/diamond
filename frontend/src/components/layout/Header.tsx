import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buttonClass } from '#/components/ui/button'
import { Container } from '#/components/ui/Section'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import { Logo } from './Logo'
import { MobileNav } from './MobileNav'
import { NAV_LINKS } from './nav-links'

/** True once the page has scrolled a little; false on the server and at the top. */
function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [offset])
  return scrolled
}

/**
 * Sticky header. On desktop the emergency number is a red button at the right; on phones
 * and tablets the red EmergencyBar at the bottom of the screen does that job.
 */
export function Header() {
  const scrolled = useScrolled()

  return (
    <header
      data-ui=""
      className={clsx(
        'sticky top-0 z-40 border-b bg-white transition-[box-shadow,border-color] duration-300',
        scrolled ? 'border-slate-200 shadow-card' : 'border-transparent',
      )}
    >
      <Container className="flex h-[4.75rem] items-center justify-between gap-6">
        <Logo />

        <nav aria-label={m.nav.label} className="hidden lg:block">
          <ul className="flex list-none items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.exact }}
                  className={clsx(
                    'relative block rounded-md px-3.5 py-2 text-[1rem] font-medium text-slate-700 transition-colors hover:text-navy-950',
                    'after:absolute after:inset-x-3.5 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-blue-600 after:transition-transform after:duration-300 after:ease-smooth',
                    'hover:after:scale-x-100 data-[status=active]:font-semibold data-[status=active]:text-blue-600 data-[status=active]:after:scale-x-100',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:block">
          <a
            href={EMERGENCY_PHONE.href}
            className={buttonClass('emergency', 'sm')}
          >
            <Phone aria-hidden="true" />
            <span className="whitespace-nowrap tabular-nums">
              {fmt(m.home.emergencyCta, { number: EMERGENCY_PHONE.display })}
            </span>
          </a>
        </div>

        <MobileNav />
      </Container>
    </header>
  )
}
