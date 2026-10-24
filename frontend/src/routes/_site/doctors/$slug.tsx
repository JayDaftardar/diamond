import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { ArrowLeft, Clock, Phone } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { doctorPhotoSrc } from '#/components/Doctor'
import { OpdStatusLine } from '#/components/OpdStatus'
import { TreatmentList } from '#/components/departments/TreatmentList'
import { DoctorPortrait } from '#/components/doctors/DoctorCard'
import { buttonClass } from '#/components/ui/button'
import { PageHead } from '#/components/ui/PageHead'
import { Container } from '#/components/ui/Section'
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
      <PageHead
        reserveRight
        crumbs={[
          { label: m.nav.home, to: '/' },
          { label: m.doctors.title, to: '/doctors' },
          { label: doctor.name },
        ]}
        eyebrow={doctor.speciality}
        title={doctor.name}
        intro={doctor.designation}
      />

      <section className="pb-16 lg:pb-24">
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16">
          {/* Photo and OPD: first on phones, to the right (overlapping the band) on desktop. */}
          <div className="order-first mx-auto -mt-0 w-full max-w-sm lg:sticky lg:top-28 lg:order-last lg:-mt-52 lg:max-w-none">
            <div
              className="overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-slate-200/70"
              data-settle=""
            >
              <DoctorPortrait doctor={doctor} eager />
            </div>

            <div className="mt-5 rounded-2xl bg-blue-50 p-5">
              <p className="flex items-center gap-2 text-eyebrow font-bold text-blue-600 uppercase">
                <Clock className="size-4" aria-hidden="true" />
                {m.doctors.opdTimings}
              </p>
              <p className="mt-3 font-semibold text-navy-950">
                {doctor.opd_timings ?? m.doctors.opdUnknown}
              </p>
              <OpdStatusLine
                timings={doctor.opd_timings}
                className="mt-1 block font-semibold text-blue-700"
              />
              <p className="text-slate-600 mt-3 text-[0.9375rem]">
                {fmt(m.doctors.confirmCall, { number })}
              </p>
              <a
                href={EMERGENCY_PHONE.href}
                className={buttonClass('emergency', 'md', 'mt-5 w-full')}
              >
                <Phone aria-hidden="true" />
                <span className="whitespace-nowrap tabular-nums">
                  {fmt(m.home.callCta, { number })}
                </span>
              </a>
            </div>
          </div>

          <dl className="pt-2 lg:pt-12">
            {doctor.qualifications ? (
              <Fact label={m.doctors.qualifications} i={0}>
                {doctor.qualifications}
              </Fact>
            ) : null}
            {doctor.training.length > 0 ? (
              <Fact label={m.doctors.training} i={1}>
                <BulletList items={doctor.training} />
              </Fact>
            ) : null}
            {doctor.achievements.length > 0 ? (
              <Fact label={m.doctors.recognition} i={2}>
                <BulletList items={doctor.achievements} />
              </Fact>
            ) : null}
            {doctor.expertise.length > 0 ? (
              <Fact label={m.doctors.expertise} i={3}>
                <ul className="flex list-none flex-wrap gap-2">
                  {doctor.expertise.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-blue-50 px-3.5 py-1.5 text-[0.9375rem] font-medium text-navy-900 ring-1 ring-blue-600/10 ring-inset"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Fact>
            ) : null}
            {doctor.departments.length > 0 ? (
              <Fact label={m.doctors.departments} i={4}>
                <ul className="flex list-none flex-wrap gap-2">
                  {doctor.departments.map((department) => (
                    <li key={department.slug}>
                      <Link
                        to="/departments/$slug"
                        params={{ slug: department.slug }}
                        className="block rounded-full px-3.5 py-1.5 text-[0.9375rem] font-semibold text-blue-700 ring-1 ring-blue-600/30 transition-colors ring-inset hover:bg-blue-600 hover:text-white"
                      >
                        {department.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Fact>
            ) : null}
            <div className="border-t border-slate-200 pt-8">
              <Link to="/doctors" className={buttonClass('soft')} data-rise="">
                <ArrowLeft aria-hidden="true" />
                {m.doctors.allDoctors}
              </Link>
            </div>
          </dl>
        </Container>
      </section>

      {doctor.treatments.length > 0 ? (
        <section
          aria-labelledby="doctor-treatments"
          className="bg-blue-50 py-14 lg:py-20"
        >
          <Container>
            <h2
              id="doctor-treatments"
              className="mb-8 font-heading text-[1.75rem] font-semibold text-navy-950 sm:text-[2rem]"
              data-rise=""
            >
              {m.doctors.treatments}
            </h2>
            <TreatmentList treatments={doctor.treatments} showDepartment />
          </Container>
        </section>
      ) : null}
    </>
  )
}

/** One labelled row of the profile: a small label, then the details. */
function Fact({
  label,
  i,
  children,
}: {
  label: string
  i: number
  children: ReactNode
}) {
  return (
    <div
      className="grid gap-3 border-t border-slate-200 py-7 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
      data-rise=""
      style={{ '--i': i } as CSSProperties}
    >
      <dt className="text-eyebrow font-bold text-blue-600 uppercase">
        {label}
      </dt>
      <dd className="text-[1.0625rem] text-slate-700">{children}</dd>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid list-disc gap-2 pl-5 marker:text-blue-600">
      {items.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
