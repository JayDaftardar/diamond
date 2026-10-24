import { Link } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import type { CSSProperties } from 'react'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import { buttonClass } from './button'
import { Container } from './Section'

/** The blue call-to-action panel that ends a page: call, or send a message. */
export function Closing({
  id,
  title,
  body,
}: {
  id: string
  title: string
  body: string
}) {
  return (
    <section aria-labelledby={id} className="py-20 lg:py-24">
      <Container>
        <div className="grid items-center gap-8 rounded-3xl bg-blue-600 px-6 py-12 text-white sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 lg:px-16 lg:py-16 [&_:focus-visible]:outline-white">
          <div>
            <h2
              id={id}
              className="font-heading text-h2 font-semibold text-balance"
              data-rise=""
            >
              {title}
            </h2>
            <p
              className="mt-4 text-lead text-white/85"
              data-rise=""
              style={{ '--i': 1 } as CSSProperties}
            >
              {body}
            </p>
          </div>
          <div
            className="flex flex-wrap gap-3"
            data-rise=""
            style={{ '--i': 2 } as CSSProperties}
          >
            <a href={EMERGENCY_PHONE.href} className={buttonClass('light')}>
              <Phone aria-hidden="true" />
              <span className="whitespace-nowrap tabular-nums">
                {fmt(m.home.callCta, { number: EMERGENCY_PHONE.display })}
              </span>
            </a>
            <Link to="/contact" className={buttonClass('outline-light')}>
              {m.home.contactMessage}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
