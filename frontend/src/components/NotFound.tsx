import { Link } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { SiteLayout } from '#/components/layout/SiteLayout'
import { buttonClass } from '#/components/ui/button'
import { Container } from '#/components/ui/Section'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

/** Shown for any address that does not exist (the server also answers with HTTP 404). */
export function NotFound() {
  return (
    <SiteLayout>
      <section className="py-20 lg:py-32">
        <Container className="max-w-3xl">
          <p
            className="font-heading text-[5rem] leading-none font-semibold text-blue-600/25 sm:text-[7rem]"
            aria-hidden="true"
          >
            404
          </p>
          <h1 className="mt-4 font-heading text-h1 font-semibold text-balance text-navy-950">
            {m.notFound.title}
          </h1>
          <p className="mt-5 max-w-xl text-lead text-slate-700">
            {m.notFound.body}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/" className={buttonClass('primary')}>
              {m.notFound.home}
            </Link>
            <a href={EMERGENCY_PHONE.href} className={buttonClass('emergency')}>
              <Phone aria-hidden="true" />
              <span className="whitespace-nowrap tabular-nums">
                {fmt(m.home.callCta, { number: EMERGENCY_PHONE.display })}
              </span>
            </a>
          </div>
        </Container>
      </section>
    </SiteLayout>
  )
}
