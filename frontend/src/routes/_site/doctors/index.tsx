import { createFileRoute } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { DoctorGrid } from '#/components/doctors/DoctorCard'
import { PageHead } from '#/components/ui/PageHead'
import { Container } from '#/components/ui/Section'
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
      <PageHead
        crumbs={[{ label: m.nav.home, to: '/' }, { label: m.doctors.title }]}
        eyebrow={m.doctors.eyebrow}
        title={m.doctors.h1}
        intro={m.doctors.intro}
      />
      <section className="py-14 lg:py-20">
        <Container>
          <p
            className="mb-10 flex max-w-3xl items-start gap-3 text-slate-700"
            data-rise=""
          >
            <Phone
              className="mt-1 size-4 shrink-0 text-blue-600"
              aria-hidden="true"
            />
            {fmt(m.home.doctorsNote, { number: EMERGENCY_PHONE.display })}
          </p>
          <DoctorGrid doctors={doctors} headingLevel="h2" />
        </Container>
      </section>
    </>
  )
}
