import { Link, createFileRoute } from '@tanstack/react-router'
import { DoctorGrid } from '#/components/Doctor'
import { ChevronRightIcon, MapPinIcon, PhoneIcon } from '#/components/Icon'
import { InsurerStrip } from '#/components/InsurerStrip'
import { Photo } from '#/components/ui/Photo'
import {
  DIRECTIONS_URL,
  EMERGENCY_PHONE,
  HOSPITAL_PHOTOS,
  PHONES,
} from '#/content/config'
import { fetchDepartments, fetchDoctors } from '#/lib/api'
import { hospitalJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/')({
  loader: async () => {
    const [departments, doctors] = await Promise.all([
      fetchDepartments(),
      fetchDoctors(),
    ])
    return { departments, doctors }
  },
  head: () =>
    buildHead({
      title: m.site.homeTitle,
      fullTitle: true,
      description: m.site.description,
      path: '/',
      jsonLd: [hospitalJsonLd()],
    }),
  component: Home,
})

function Home() {
  const { departments, doctors } = Route.useLoaderData()
  const number = EMERGENCY_PHONE.display

  return (
    <>
      {/* 1. Hero: hospital photo, name, actions, emergency numbers */}
      <section className="hero">
        <div className="wrap hero__grid">
          <div className="hero__text">
            <h1 data-rise="">{m.home.h1}</h1>
            <p
              className="hero__venture"
              data-rise=""
              style={{ '--i': 1 } as React.CSSProperties}
            >
              {m.site.venture}
            </p>
            <p
              className="hero__lead"
              data-rise=""
              style={{ '--i': 2 } as React.CSSProperties}
            >
              {m.home.lead}
            </p>
            <div
              className="button-row"
              data-rise=""
              style={{ '--i': 3 } as React.CSSProperties}
            >
              <a className="btn btn--primary" href={EMERGENCY_PHONE.href}>
                <PhoneIcon />
                {fmt(m.home.callCta, { number })}
              </a>
              <a
                className="btn btn--quiet"
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPinIcon />
                {m.home.directions}
              </a>
            </div>
          </div>
          <div className="hero__photo" data-settle="">
            <Photo
              file={HOSPITAL_PHOTOS.front}
              alt={m.home.photoAlt}
              ratio="4 / 3"
              priority
              placeholderLabel={m.home.photoPlaceholder}
            />
          </div>
        </div>

        <div className="wrap">
          <div className="emergency-panel" data-rise="">
            <div>
              <h2 className="emergency-panel__title">
                {m.home.emergencyTitle}
              </h2>
              <p>{m.home.emergencyText}</p>
            </div>
            <ul className="emergency-panel__numbers">
              {PHONES.map((phone) => (
                <li key={phone.href}>
                  <a href={phone.href}>
                    <PhoneIcon />
                    <span className="tel">{phone.display}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Department highlights */}
      <section className="section" aria-labelledby="home-departments">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 id="home-departments" data-rise="">
                {m.home.departmentsTitle}
              </h2>
              <p data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
                {fmt(m.home.departmentsIntro, { count: departments.length })}
              </p>
            </div>
            <Link to="/departments" className="go">
              {m.home.allDepartments}
              <ChevronRightIcon />
            </Link>
          </div>
          <ul className="card-grid card-grid--departments">
            {departments.map((department, index) => (
              <li
                key={department.slug}
                className="card dept-card"
                data-rise=""
                style={{ '--i': index % 4 } as React.CSSProperties}
              >
                <h3>
                  <Link
                    to="/departments/$slug"
                    params={{ slug: department.slug }}
                  >
                    {department.name}
                  </Link>
                </h3>
                {department.doctor_names.length > 0 ? (
                  <p className="small muted">
                    {department.doctor_names.join(', ')}
                  </p>
                ) : null}
                <span className="card__more" aria-hidden="true">
                  {department.treatment_count > 0
                    ? department.treatment_count === 1
                      ? m.departments.countOne
                      : fmt(m.departments.count, {
                          count: department.treatment_count,
                        })
                    : m.home.viewDepartment}
                  <ChevronRightIcon />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Featured doctors */}
      <section
        className="section section--field"
        aria-labelledby="home-doctors"
      >
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 id="home-doctors" data-rise="">
                {m.home.doctorsTitle}
              </h2>
              <p data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
                {m.home.doctorsIntro}
              </p>
            </div>
            <Link to="/doctors" className="go">
              {m.home.allDoctors}
              <ChevronRightIcon />
            </Link>
          </div>
          <DoctorGrid doctors={doctors.slice(0, 8)} />
        </div>
      </section>

      {/* 4. Ayushman Bharat and insurance partners */}
      <section className="section" aria-labelledby="home-cover">
        <div className="wrap">
          <div className="section-head">
            <h2 id="home-cover" data-rise="">
              {m.home.coverTitle}
            </h2>
          </div>
          <div className="cover-grid">
            <div className="ayushman-panel" data-rise="">
              <h3>{m.home.ayushmanTitle}</h3>
              <p>{m.home.ayushmanText}</p>
              <ul className="tick-list">
                {m.ayushman.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
              <Link to="/about" className="go">
                {m.home.coverLink}
                <ChevronRightIcon />
              </Link>
            </div>
            <div data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
              <h3 className="cover-grid__title">{m.home.insurersTitle}</h3>
              <InsurerStrip />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Facilities overview */}
      <section className="section" aria-labelledby="home-facilities">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2 id="home-facilities" data-rise="">
                {m.home.facilitiesTitle}
              </h2>
              <p data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
                {m.home.facilitiesIntro}
              </p>
            </div>
            <Link to="/about" className="go">
              {m.home.facilitiesLink}
              <ChevronRightIcon />
            </Link>
          </div>
          <ul className="facility-grid">
            {m.facilities.items.map((item, index) => (
              <li
                key={item}
                data-rise=""
                style={{ '--i': index % 4 } as React.CSSProperties}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Contact call-to-action */}
      <section className="cta-band" aria-labelledby="home-contact">
        <div className="wrap cta-band__inner">
          <div>
            <h2 id="home-contact">{m.home.contactTitle}</h2>
            <p>{m.home.contactBody}</p>
          </div>
          <div className="button-row">
            <a className="btn btn--primary" href={EMERGENCY_PHONE.href}>
              <PhoneIcon />
              {fmt(m.home.callCta, { number })}
            </a>
            <Link to="/contact" className="btn btn--light">
              {m.home.contactMessage}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
