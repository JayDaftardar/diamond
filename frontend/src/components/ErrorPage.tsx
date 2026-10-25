import { useRouter } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { SiteLayout } from '#/components/layout/SiteLayout'
import { buttonClass } from '#/components/ui/button'
import { Container } from '#/components/ui/Section'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

/** Shown when a page fails to load (for example the API is unreachable). */
export function ErrorPage() {
  const router = useRouter()
  return (
    <SiteLayout>
      <section className="py-20 lg:py-32">
        <Container className="max-w-3xl">
          <h1 className="font-heading text-h1 font-semibold text-balance text-navy-950">
            {m.error.title}
          </h1>
          <p className="mt-5 max-w-xl text-lead text-slate-700">
            {m.error.body}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass('primary')}
              onClick={() => void router.invalidate()}
            >
              {m.error.retry}
            </button>
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
