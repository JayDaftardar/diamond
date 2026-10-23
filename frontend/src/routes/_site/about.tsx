import { Link, createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { InsurerStrip } from '#/components/InsurerStrip'
import { Photo } from '#/components/ui/Photo'
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

function About() {
  const number = EMERGENCY_PHONE.display

  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={[{ label: m.nav.home, to: '/' }, { label: m.about.title }]}
        />
        <h1 data-rise="">{m.about.h1}</h1>
        <p
          className="statement"
          data-rise=""
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {m.about.venture}
        </p>
      </section>

      <section className="section wrap two-col" aria-label={m.about.title}>
        <div data-settle="">
          <Photo
            file={HOSPITAL_PHOTOS.interior}
            alt={m.about.photoAlt}
            ratio="4 / 5"
            priority
            placeholderLabel={m.placeholder.photo}
          />
        </div>
        <div
          className="stack"
          style={{ '--stack': 'var(--s-5)' } as React.CSSProperties}
        >
          {m.about.overview.map((paragraph, index) => (
            <p
              key={paragraph}
              data-rise=""
              style={{ '--i': index } as React.CSSProperties}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="about-facilities">
        <div className="wrap split">
          <h2 id="about-facilities" data-rise="">
            {m.facilities.title}
          </h2>
          <ul
            className="facility-list"
            data-rise=""
            style={{ '--i': 1 } as React.CSSProperties}
          >
            {m.facilities.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="section section--ink on-ink"
        aria-labelledby="about-ayushman"
      >
        <div className="wrap split">
          <h2 id="about-ayushman" data-rise="">
            {m.ayushman.title}
          </h2>
          <div
            className="stack"
            style={{ '--stack': 'var(--s-6)' } as React.CSSProperties}
          >
            <p className="statement" data-rise="">
              {m.ayushman.statement}
            </p>
            <div
              className="split"
              data-rise=""
              style={{ '--i': 1 } as React.CSSProperties}
            >
              <div className="stack">
                <h3>{m.ayushman.benefitsTitle}</h3>
                <ul>
                  {m.ayushman.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <div className="stack">
                <h3>{m.ayushman.coveredTitle}</h3>
                <ul>
                  {m.ayushman.covered.map((procedure) => (
                    <li key={procedure}>{procedure}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section section--field"
        aria-labelledby="about-insurance"
      >
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 id="about-insurance" data-rise="">
                {m.insurance.title}
              </h2>
              <p data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
                {m.about.insuranceIntro}{' '}
                {fmt(m.about.insuranceCheck, { number })}
              </p>
            </div>
          </div>
          <div data-rise="">
            <InsurerStrip />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="about-faq">
        <div className="wrap split">
          <h2 id="about-faq" data-rise="">
            {m.faq.title}
          </h2>
          <div
            className="faq"
            data-rise=""
            style={{ '--i': 1 } as React.CSSProperties}
          >
            {m.faq.items.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--field">
        <div className="wrap split">
          <h2>{m.about.ctaTitle}</h2>
          <div className="button-row">
            <Link to="/contact" className="btn btn--primary">
              {m.nav.contact}
            </Link>
            <Link to="/doctors" className="btn btn--quiet">
              {m.nav.doctors}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
