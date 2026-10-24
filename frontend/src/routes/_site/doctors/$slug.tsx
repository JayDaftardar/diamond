import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { DoctorPhoto, doctorPhotoSrc } from '#/components/Doctor'
import { OpdStatusLine } from '#/components/OpdStatus'
import { PhoneIcon } from '#/components/Icon'
import { TreatmentList } from '#/components/departments/TreatmentList'
import { EMERGENCY_PHONE } from '#/content/config'
import { fetchDoctor } from '#/lib/api'
import { breadcrumbJsonLd, physicianJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { newSlugOrNotFound } from '#/lib/loaders'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/doctors/$slug')({
  loader: async ({ params }) => {
    const doctor = await fetchDoctor({ data: { slug: params.slug } })
    if (!doctor) {
      // Renamed? Send a permanent redirect. Otherwise this is a 404.
      const slug = await newSlugOrNotFound('doctor', params.slug)
      throw redirect({
        to: '/doctors/$slug',
        params: { slug },
        statusCode: 301,
      })
    }
    return doctor
  },
  head: ({ loaderData: doctor }) => {
    if (!doctor) return {}
    const photo = doctorPhotoSrc(doctor.photo_url)
    return buildHead({
      title: fmt(m.doctors.profileTitle, {
        name: doctor.name,
        designation: doctor.designation,
      }),
      description: fmt(m.doctors.profileDescription, {
        name: doctor.name,
        designation: doctor.designation,
        speciality: doctor.speciality,
        opd: doctor.opd_timings
          ? `${m.doctors.opdLabel}: ${doctor.opd_timings}.`
          : m.doctors.opdUnknown + '.',
      }),
      path: `/doctors/${doctor.slug}`,
      type: 'profile',
      image: photo ?? undefined,
      jsonLd: [
        physicianJsonLd(doctor, photo),
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.doctors.title, path: '/doctors' },
          { name: doctor.name, path: `/doctors/${doctor.slug}` },
        ]),
      ],
    })
  },
  component: DoctorProfile,
})

function DoctorProfile() {
  const doctor = Route.useLoaderData()
  const number = EMERGENCY_PHONE.display

  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={[
            { label: m.nav.home, to: '/' },
            { label: m.doctors.title, to: '/doctors' },
            { label: doctor.name },
          ]}
        />
        <div className="profile">
          <div className="profile__photo" data-settle="">
            <DoctorPhoto doctor={doctor} eager />
          </div>

          <div
            className="stack"
            style={{ '--stack': 'var(--s-6)' } as React.CSSProperties}
          >
            <div>
              <h1 data-rise="">{doctor.name}</h1>
              <p
                className="statement"
                data-rise=""
                style={
                  { '--i': 1, marginTop: 'var(--s-4)' } as React.CSSProperties
                }
              >
                {doctor.designation}
              </p>
              <p
                className="muted"
                data-rise=""
                style={{ '--i': 2 } as React.CSSProperties}
              >
                {doctor.speciality}
              </p>
            </div>

            <dl className="facts">
              <div data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
                <dt>{m.doctors.opdTimings}</dt>
                <dd>
                  <p>{doctor.opd_timings ?? m.doctors.opdUnknown}</p>
                  <OpdStatusLine
                    timings={doctor.opd_timings}
                    className="opd-status"
                  />
                  <p
                    className="small muted"
                    style={{ marginTop: 'var(--s-2)' }}
                  >
                    {fmt(m.doctors.confirmCall, { number })}
                  </p>
                </dd>
              </div>
              {doctor.qualifications ? (
                <div data-rise="" style={{ '--i': 2 } as React.CSSProperties}>
                  <dt>{m.doctors.qualifications}</dt>
                  <dd>{doctor.qualifications}</dd>
                </div>
              ) : null}
              {doctor.training.length > 0 ? (
                <div data-rise="" style={{ '--i': 3 } as React.CSSProperties}>
                  <dt>{m.doctors.training}</dt>
                  <dd>
                    <ul>
                      {doctor.training.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              {doctor.achievements.length > 0 ? (
                <div data-rise="" style={{ '--i': 4 } as React.CSSProperties}>
                  <dt>{m.doctors.recognition}</dt>
                  <dd>
                    <ul>
                      {doctor.achievements.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              {doctor.expertise.length > 0 ? (
                <div data-rise="" style={{ '--i': 5 } as React.CSSProperties}>
                  <dt>{m.doctors.expertise}</dt>
                  <dd>
                    <ul>
                      {doctor.expertise.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              {doctor.departments.length > 0 ? (
                <div data-rise="" style={{ '--i': 6 } as React.CSSProperties}>
                  <dt>{m.doctors.departments}</dt>
                  <dd>
                    <ul>
                      {doctor.departments.map((department) => (
                        <li key={department.slug}>
                          <Link
                            to="/departments/$slug"
                            params={{ slug: department.slug }}
                          >
                            {department.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div
              className="button-row"
              data-rise=""
              style={{ '--i': 4 } as React.CSSProperties}
            >
              <a className="btn btn--emergency" href={EMERGENCY_PHONE.href}>
                <PhoneIcon />
                {fmt(m.home.callCta, { number })}
              </a>
              <Link to="/doctors" className="btn btn--quiet">
                {m.doctors.allDoctors}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {doctor.treatments.length > 0 ? (
        <section className="section section--field">
          <div className="wrap split">
            <h2>{m.doctors.treatments}</h2>
            <TreatmentList treatments={doctor.treatments} showDepartment />
          </div>
        </section>
      ) : null}
    </>
  )
}
