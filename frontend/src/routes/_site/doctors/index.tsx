import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { DoctorGrid } from '#/components/Doctor'
import { EMERGENCY_PHONE } from '#/content/config'
import { fetchDoctors } from '#/lib/api'
import { breadcrumbJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/doctors/')({
  loader: () => fetchDoctors(),
  head: () =>
    buildHead({
      title: m.doctors.title,
      description: m.doctors.description,
      path: '/doctors',
      jsonLd: [
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.doctors.title, path: '/doctors' },
        ]),
      ],
    }),
  component: Doctors,
})

function Doctors() {
  const doctors = Route.useLoaderData()

  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={[{ label: m.nav.home, to: '/' }, { label: m.doctors.title }]}
        />
        <h1 data-rise="">{m.doctors.h1}</h1>
        <p
          className="statement"
          data-rise=""
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {m.doctors.intro}
        </p>
      </section>
      <section className="section">
        <div
          className="wrap stack"
          style={{ '--stack': 'var(--s-5)' } as React.CSSProperties}
        >
          <p className="muted" data-rise="">
            {fmt(m.home.doctorsNote, { number: EMERGENCY_PHONE.display })}
          </p>
          <DoctorGrid doctors={doctors} />
        </div>
      </section>
    </>
  )
}
