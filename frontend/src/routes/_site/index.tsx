import { Link, createFileRoute } from '@tanstack/react-router'
import { clsx } from 'clsx'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  HeartPulse,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { DoctorRow } from '#/components/doctors/DoctorCard'
import { arrowLinkClass, buttonClass } from '#/components/ui/button'
import { Closing } from '#/components/ui/Closing'
import { InsurerTiles } from '#/components/ui/InsurerTiles'
import {
  Accent,
  Container,
  Eyebrow,
  SectionHeader,
} from '#/components/ui/Section'
import {
  DIRECTIONS_URL,
  EMERGENCY_PHONE,
  HOSPITAL_PHOTOS,
} from '#/content/config'
import { fetchDepartments, fetchDoctors } from '#/lib/api'
import { hospitalJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'
import type { DepartmentListItem } from '#/lib/types'

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

/** Stagger index for the scroll-triggered entrance (sections below the hero). */
const rise = (i: number) => ({ '--i': i }) as CSSProperties

/** Hero entrance: starts on first paint, staggered 80ms per step. */
const heroIn = (step: number) =>
  clsx(
    'animate-rise motion-reduce:animate-none',
    [
      '',
      '[animation-delay:80ms]',
      '[animation-delay:160ms]',
      '[animation-delay:240ms]',
      '[animation-delay:320ms]',
      '[animation-delay:400ms]',
    ][step],
  )

function Home() {
  const { departments, doctors } = Route.useLoaderData()

  return (
    <>
      <Hero departmentCount={departments.length} />
      <Departments departments={departments} />
      {doctors.length > 0 ? (
        <section
          aria-labelledby="home-doctors"
          className="overflow-hidden bg-blue-50 py-20 lg:py-28"
        >
          <Container>
            <SectionHeader
              id="home-doctors"
              eyebrow={m.home.doctorsEyebrow}
              title={m.home.doctorsHeading}
              intro={m.home.doctorsIntro}
              action={
                <Link to="/doctors" className={arrowLinkClass}>
                  {m.home.allDoctors}
                  <ArrowRight aria-hidden="true" />
                </Link>
              }
            />
            <div className="mt-10 lg:mt-12">
              <DoctorRow
                doctors={doctors.slice(0, 8)}
                labelledBy="home-doctors"
              />
            </div>
          </Container>
        </section>
      ) : null}
      <Cover />
      <Facilities />
      <Closing
        id="home-contact"
        title={m.home.contactTitle}
        body={m.home.contactBody}
      />
    </>
  )
}

/* ------------------------------------------------------------------ hero */

function Hero({ departmentCount }: { departmentCount: number }) {
  const facts = [
    { value: String(departmentCount), label: m.home.factDepartments },
    { value: m.home.factEmergencyValue, label: m.home.factEmergency },
    { value: m.home.factCoverValue, label: m.home.factCover },
  ]

  return (
    <section
      aria-labelledby="home-title"
      className="pt-10 pb-20 sm:pt-14 lg:pt-20 lg:pb-28"
    >
      <Container className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
        <div>
          <Eyebrow pill className={heroIn(0)}>
            {m.home.heroEyebrow}
          </Eyebrow>
          <h1
            id="home-title"
            className={clsx(
              'mt-6 font-heading text-display font-semibold text-balance text-navy-950',
              heroIn(1),
            )}
          >
            {/* Two lines from tablet up: the statement, then the accented answer. */}
            <span className="sm:block">{m.home.heroTitleStart}</span>{' '}
            <Accent>{m.home.heroTitleAccent}</Accent> {m.home.heroTitleEnd}
          </h1>
          <p
            className={clsx(
              'mt-6 max-w-xl text-lead text-pretty text-slate-700',
              heroIn(2),
            )}
          >
            {m.home.heroLead}
          </p>

          <div
            className={clsx(
              'mt-9 flex flex-wrap items-center gap-3',
              heroIn(3),
            )}
          >
            <a href={EMERGENCY_PHONE.href} className={buttonClass('emergency')}>
              <Phone aria-hidden="true" />
              <span className="whitespace-nowrap tabular-nums">
                {fmt(m.home.emergencyCta, { number: EMERGENCY_PHONE.display })}
              </span>
            </a>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('soft')}
            >
              {m.home.directions}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
          <p className={clsx('mt-6', heroIn(4))}>
            <Link to="/departments" className={arrowLinkClass}>
              {m.home.exploreDepartments}
              <ArrowRight aria-hidden="true" />
            </Link>
          </p>

          <dl
            className={clsx(
              'mt-12 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8 sm:gap-8',
              heroIn(5),
            )}
            aria-label={m.home.facts}
          >
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse gap-1.5">
                <dt className="text-[0.8125rem] leading-snug text-slate-500 sm:text-sm">
                  {fact.label}
                </dt>
                <dd className="font-heading text-[1.625rem] leading-none font-semibold text-navy-950 tabular-nums sm:text-[2rem]">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:pl-4">
          {HOSPITAL_PHOTOS.front ? (
            <figure
              className="aspect-[5/4] overflow-hidden rounded-2xl bg-slate-100 shadow-float lg:aspect-[10/11]"
              data-settle=""
            >
              <img
                src={`/images/hospital/${HOSPITAL_PHOTOS.front}`}
                alt={m.home.photoAlt}
                width={720}
                height={480}
                fetchPriority="high"
                className="size-full object-cover object-[45%_center]"
              />
            </figure>
          ) : (
            <div className="aspect-[5/4] rounded-2xl bg-blue-50 lg:aspect-[10/11]" />
          )}

          {/* A small card resting on the photo's lower edge. */}
          <div className="relative mx-4 -mt-10 flex animate-float-in items-center gap-4 rounded-xl bg-white p-4 pr-6 shadow-float ring-1 ring-slate-200/70 motion-reduce:animate-none sm:mx-auto sm:max-w-sm lg:absolute lg:bottom-10 lg:-left-10 lg:mx-0 lg:mt-0">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <HeartPulse className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold text-navy-950">
                {m.home.floatTitle}
              </span>
              <span className="block text-sm text-slate-500">
                {m.home.floatText}
              </span>
            </span>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ----------------------------------------------------------- departments */

function Departments({ departments }: { departments: DepartmentListItem[] }) {
  return (
    <section
      aria-labelledby="home-departments"
      className="border-t border-slate-200 py-20 lg:py-28"
    >
      <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Eyebrow data-rise="">{m.home.departmentsTitle}</Eyebrow>
          <h2
            id="home-departments"
            className="mt-3 font-heading text-h2 font-semibold text-balance text-navy-950"
            data-rise=""
            style={rise(1)}
          >
            {fmt(m.home.departmentsHeading, { count: departments.length })}
          </h2>
          <p
            className="mt-5 text-lead text-pretty text-slate-700"
            data-rise=""
            style={rise(2)}
          >
            {m.home.departmentsLead}
          </p>
          <Link
            to="/departments"
            className={buttonClass('soft', 'md', 'mt-8')}
            data-rise=""
            style={rise(3)}
          >
            {m.home.allDepartments}
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <ul className="grid list-none content-start sm:grid-cols-2 sm:gap-x-10">
          {departments.map((department, index) => (
            <li
              key={department.slug}
              className="border-b border-slate-200 first:border-t sm:[&:nth-child(2)]:border-t"
              data-rise=""
              style={rise(index % 2)}
            >
              <Link
                to="/departments/$slug"
                params={{ slug: department.slug }}
                className="group flex items-start justify-between gap-4 py-5"
              >
                <span>
                  <span className="block font-heading text-[1.1875rem] leading-snug font-semibold text-navy-950 transition-colors group-hover:text-blue-600">
                    {department.name}
                  </span>
                  <span className="mt-1 block text-[0.9375rem] text-slate-500">
                    {department.doctor_names.length > 0
                      ? department.doctor_names.join(', ')
                      : department.treatment_count > 0
                        ? department.treatment_count === 1
                          ? m.departments.countOne
                          : fmt(m.departments.count, {
                              count: department.treatment_count,
                            })
                        : m.home.viewDepartment}
                  </span>
                </span>
                <ArrowRight
                  className="mt-1 size-5 shrink-0 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600 motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* ---------------------------------------------- Ayushman Bharat and insurers */

function Cover() {
  const partners = m.insurance.partners
  return (
    <section aria-labelledby="home-cover" className="py-20 lg:py-28">
      <Container>
        <div className="grid gap-10 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/80 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:p-14">
          <div className="self-center">
            <Eyebrow pill icon={<ShieldCheck />} data-rise="">
              {m.home.coverEyebrow}
            </Eyebrow>
            <h2
              id="home-cover"
              className="mt-5 font-heading text-h2 font-semibold text-balance text-navy-950"
              data-rise=""
              style={rise(1)}
            >
              {m.home.coverTitle}
            </h2>
            <p
              className="mt-5 text-lead text-pretty text-slate-700"
              data-rise=""
              style={rise(2)}
            >
              {m.home.ayushmanText}
            </p>
            <ul
              className="mt-7 grid list-none gap-x-6 gap-y-3 sm:grid-cols-2"
              data-rise=""
              style={rise(3)}
            >
              {m.ayushman.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2.5 text-slate-700">
                  <Check
                    className="mt-1 size-4 shrink-0 text-blue-600"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              ))}
            </ul>
            <Link
              to="/about"
              className={buttonClass('primary', 'md', 'mt-9')}
              data-rise=""
              style={rise(4)}
            >
              {m.home.coverLink}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div
            className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70 sm:p-7"
            data-rise=""
            style={rise(2)}
          >
            <h3 className="text-eyebrow font-bold text-navy-950 uppercase">
              {m.home.insurersTitle}
            </h3>
            <p className="mt-2 text-[0.9375rem] text-slate-500">
              {fmt(m.home.insurersNote, { count: partners.length })}
            </p>
            <InsurerTiles className="mt-5" />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------ facilities */

function Facilities() {
  return (
    <section
      aria-labelledby="home-facilities"
      className="bg-navy-950 py-20 text-white lg:py-28 [&_:focus-visible]:outline-white"
    >
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-20">
        {HOSPITAL_PHOTOS.interior ? (
          <figure
            className="mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-navy-900 lg:max-w-none"
            data-settle=""
          >
            <img
              src={`/images/hospital/${HOSPITAL_PHOTOS.interior}`}
              alt={m.home.facilitiesPhotoAlt}
              width={349}
              height={454}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          </figure>
        ) : null}

        <div>
          <Eyebrow tone="light" data-rise="">
            {m.home.facilitiesTitle}
          </Eyebrow>
          <h2
            id="home-facilities"
            className="mt-3 font-heading text-h2 font-semibold text-balance"
            data-rise=""
            style={rise(1)}
          >
            {m.facilities.title}
          </h2>
          <p
            className="mt-5 max-w-2xl text-lead text-pretty text-white/80"
            data-rise=""
            style={rise(2)}
          >
            {m.home.facilitiesLead}
          </p>

          <ol className="mt-10 grid list-none gap-x-10 sm:grid-cols-2">
            {m.facilities.items.map((item, index) => (
              <li
                key={item}
                className={clsx(
                  'flex items-baseline gap-4 border-b border-white/12 py-3.5',
                  index === 0 && 'border-t',
                  index === 1 && 'sm:border-t',
                )}
                data-rise=""
                style={rise(index % 2)}
              >
                <span
                  className="w-6 shrink-0 font-heading text-sm text-white/45 tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[1.0625rem] font-medium">{item}</span>
              </li>
            ))}
          </ol>

          <Link
            to="/about"
            className={buttonClass('outline-light', 'md', 'mt-10')}
            data-rise=""
          >
            {m.home.facilitiesLink}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  )
}
