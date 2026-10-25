import { createFileRoute } from '@tanstack/react-router'
import { Check, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Closing } from '#/components/ui/Closing'
import { InsurerTiles } from '#/components/ui/InsurerTiles'
import { PageHead } from '#/components/ui/PageHead'
import { Container, Eyebrow } from '#/components/ui/Section'
import { EMERGENCY_PHONE, HOSPITAL_PHOTOS } from '#/content/config'
import { breadcrumbJsonLd, hospitalJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/about')({
  head: () =>
    buildHead({
      title: m.about.title,
      description: m.about.description,
      path: '/about',
      jsonLd: [
        hospitalJsonLd(),
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.about.title, path: '/about' },
        ]),
      ],
    }),
  component: About,
})

const rise = (i: number) => ({ '--i': i }) as CSSProperties
const heading = 'mt-3 font-heading text-h2 font-semibold text-balance'

function About() {
  const number = EMERGENCY_PHONE.display

  return (
    <>
      <PageHead
        crumbs={[{ label: m.nav.home, to: '/' }, { label: m.about.title }]}
        eyebrow={m.about.eyebrow}
        title={m.about.h1}
        intro={m.about.venture}
      />

      {/* Story: the building beside the hospital's own words. */}
      <section aria-label={m.about.overviewEyebrow} className="py-16 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-20">
          {HOSPITAL_PHOTOS.interior ? (
            <figure
              className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-100 shadow-float lg:max-w-none"
              data-settle=""
            >
              <img
                src={`/images/hospital/${HOSPITAL_PHOTOS.interior}`}
                alt={m.about.photoAlt}
                width={349}
                height={454}
                fetchPriority="high"
                className="size-full object-cover"
              />
            </figure>
          ) : null}
          <div>
            <Eyebrow data-rise="">{m.about.overviewEyebrow}</Eyebrow>
            <div className="mt-5 grid gap-6">
              {m.about.overview.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className={
                    index === 0
                      ? 'font-heading text-[1.375rem] leading-relaxed font-semibold text-balance text-navy-950 sm:text-[1.5rem]'
                      : 'text-lead text-pretty text-slate-700'
                  }
                  data-rise=""
                  style={rise(index + 1)}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Facilities */}
      <section
        aria-labelledby="about-facilities"
        className="bg-blue-50 py-16 lg:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow data-rise="">{m.about.facilitiesEyebrow}</Eyebrow>
            <h2
              id="about-facilities"
              className={`${heading} text-navy-950`}
              data-rise=""
              style={rise(1)}
            >
              {m.facilities.title}
            </h2>
            <p
              className="mt-5 text-lead text-pretty text-slate-700"
              data-rise=""
              style={rise(2)}
            >
              {m.about.facilitiesIntro}
            </p>
          </div>
          <ol className="grid list-none content-start sm:grid-cols-2 sm:gap-x-10">
            {m.facilities.items.map((item, index) => (
              <li
                key={item}
                className="flex items-baseline gap-4 border-b border-blue-600/15 py-4 first:border-t sm:[&:nth-child(2)]:border-t"
                data-rise=""
                style={rise(index % 2)}
              >
                <span
                  className="w-6 shrink-0 font-heading text-sm text-blue-600/60 tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[1.0625rem] font-medium text-navy-950">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Ayushman Bharat */}
      <section
        aria-labelledby="about-ayushman"
        className="bg-navy-950 py-16 text-white lg:py-24 [&_:focus-visible]:outline-white"
      >
        <Container>
          <Eyebrow tone="light" data-rise="">
            {m.about.ayushmanEyebrow}
          </Eyebrow>
          <h2
            id="about-ayushman"
            className={heading}
            data-rise=""
            style={rise(1)}
          >
            {m.ayushman.title}
          </h2>
          <p
            className="mt-5 max-w-3xl text-lead text-pretty text-white/85"
            data-rise=""
            style={rise(2)}
          >
            {m.ayushman.statement}
          </p>
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div data-rise="" style={rise(3)}>
              <h3 className="font-heading text-xl font-semibold">
                {m.ayushman.benefitsTitle}
              </h3>
              <CheckList items={m.ayushman.benefits} />
            </div>
            <div data-rise="" style={rise(4)}>
              <h3 className="font-heading text-xl font-semibold">
                {m.ayushman.coveredTitle}
              </h3>
              <CheckList items={m.ayushman.covered} />
            </div>
          </div>
        </Container>
      </section>

      {/* Cashless insurance */}
      <section aria-labelledby="about-insurance" className="py-16 lg:py-24">
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <Eyebrow data-rise="">{m.about.insuranceEyebrow}</Eyebrow>
            <h2
              id="about-insurance"
              className={`${heading} text-navy-950`}
              data-rise=""
              style={rise(1)}
            >
              {m.insurance.title}
            </h2>
            <p
              className="mt-5 text-lead text-pretty text-slate-700"
              data-rise=""
              style={rise(2)}
            >
              {m.about.insuranceIntro}
            </p>
            <p
              className="mt-4 text-lead font-medium text-pretty text-navy-950"
              data-rise=""
              style={rise(3)}
            >
              {fmt(m.about.insuranceCheck, { number })}
            </p>
          </div>
          <div
            className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/80 sm:p-8"
            data-rise=""
            style={rise(2)}
          >
            <InsurerTiles scroll />
          </div>
        </Container>
      </section>

      {/* Common questions */}
      <section
        aria-labelledby="about-faq"
        className="bg-blue-50 py-16 lg:py-24"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow data-rise="">{m.about.faqEyebrow}</Eyebrow>
            <h2
              id="about-faq"
              className={`${heading} text-navy-950`}
              data-rise=""
              style={rise(1)}
            >
              {m.faq.title}
            </h2>
            <p
              className="mt-5 text-lead text-pretty text-slate-700"
              data-rise=""
              style={rise(2)}
            >
              {fmt(m.faq.intro, { number })}
            </p>
          </div>
          <div className="grid gap-3" data-rise="" style={rise(2)}>
            {m.faq.items.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-white shadow-tile ring-1 ring-slate-200/70 transition-shadow open:shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-5 font-heading text-[1.125rem] leading-snug font-semibold text-navy-950 marker:hidden hover:text-blue-600 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <Plus
                    className="size-5 shrink-0 text-blue-600 transition-transform duration-300 ease-smooth group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-6 pb-6 text-[1.0625rem] text-pretty text-slate-700">
                  {fmt(item.a, { number })}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <Closing
        id="about-contact"
        title={m.about.ctaTitle}
        body={m.about.ctaBody}
      />
    </>
  )
}

function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 grid list-none gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-white/90">
          <Check
            className="mt-1 size-4 shrink-0 text-white"
            strokeWidth={3}
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  )
}
