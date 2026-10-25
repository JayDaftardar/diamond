import type { CSSProperties, ReactNode } from 'react'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import type { Crumb } from '#/components/Breadcrumbs'
import { Container, Eyebrow } from './Section'

/**
 * Opening of every inner page: breadcrumbs, a small label, the page heading and one line of
 * introduction on a flat pale-blue band. `children` (a search box, buttons) sit below.
 */
export function PageHead({
  crumbs,
  eyebrow,
  title,
  intro,
  children,
  reserveRight,
}: {
  crumbs: Crumb[]
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  children?: ReactNode
  /** Keep the right side clear for a picture that overlaps the band from below (desktop). */
  reserveRight?: boolean
}) {
  return (
    <section className="bg-blue-50 pt-8 pb-12 lg:pt-10 lg:pb-16">
      <Container>
        <Breadcrumbs items={crumbs} />
        <div className={reserveRight ? 'lg:pr-[25rem]' : undefined}>
          {eyebrow ? (
            <Eyebrow className="mt-8" data-rise="">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1
            className="mt-3 max-w-4xl font-heading text-h1 font-semibold text-balance text-navy-950"
            data-rise=""
            style={{ '--i': 1 } as CSSProperties}
          >
            {title}
          </h1>
          {intro ? (
            <p
              className="mt-5 max-w-2xl text-lead text-pretty text-slate-700"
              data-rise=""
              style={{ '--i': 2 } as CSSProperties}
            >
              {intro}
            </p>
          ) : null}
          {children ? (
            <div
              className="mt-8"
              data-rise=""
              style={{ '--i': 3 } as CSSProperties}
            >
              {children}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
