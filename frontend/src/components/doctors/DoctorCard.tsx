import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { doctorPhotoSrc } from '#/components/Doctor'
import { OpdStatusLine } from '#/components/OpdStatus'
import { fmt, m } from '#/lib/i18n'
import type { DoctorCardData } from '#/lib/types'

/** "Dr. Shraddha Naik" -> "SN": shown until a photo is uploaded. */
function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * A doctor's portrait in a 4:5 frame, or their initials on pale blue until a photo is
 * uploaded. The frame has no radius of its own: the parent clips it.
 */
export function DoctorPortrait({
  doctor,
  eager,
  zoom,
}: {
  doctor: Pick<DoctorCardData, 'name' | 'designation' | 'photo_url'>
  eager?: boolean
  /** Slowly enlarge the photo while the parent (a card) is hovered. */
  zoom?: boolean
}) {
  const src = doctorPhotoSrc(doctor.photo_url)
  return (
    <div className="aspect-[4/5] overflow-hidden bg-blue-50">
      {src ? (
        <img
          src={src}
          alt={fmt(m.doctors.photoAlt, {
            name: doctor.name,
            designation: doctor.designation,
          })}
          width={400}
          height={500}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className={clsx(
            'size-full object-cover',
            zoom &&
              'transition duration-700 ease-smooth group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100',
          )}
        />
      ) : (
        <div
          className="grid size-full place-items-center font-heading text-6xl font-semibold text-blue-600/35"
          aria-hidden="true"
        >
          {initials(doctor.name)}
        </div>
      )}
    </div>
  )
}

/**
 * Doctor card: portrait, speciality, name, designation and an OPD box (with today's status
 * when the timings can be read). The whole card links to the profile.
 */
export function DoctorCard({
  doctor,
  eager,
  className,
  headingLevel: Heading = 'h3',
}: {
  doctor: DoctorCardData
  eager?: boolean
  className?: string
  /** The doctor's name is a heading: h3 under a section heading, h2 straight under the page's h1. */
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <article
      className={clsx(
        'group relative flex h-full flex-col rounded-2xl bg-white p-2.5 shadow-card ring-1 ring-slate-200/70',
        'transition duration-300 ease-smooth hover:-translate-y-1 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <div className="overflow-hidden rounded-xl">
        <DoctorPortrait doctor={doctor} eager={eager} zoom />
      </div>

      <div className="flex flex-1 flex-col px-2.5 pt-5 pb-2">
        <p className="text-[0.6875rem] leading-snug font-bold tracking-[0.12em] text-blue-600 uppercase">
          {doctor.speciality}
        </p>
        <Heading className="mt-2 font-heading text-[1.25rem] leading-snug font-semibold text-navy-950">
          {/* The link covers the whole card. */}
          <Link
            to="/doctors/$slug"
            params={{ slug: doctor.slug }}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-3 focus-visible:after:outline-blue-600"
          >
            {doctor.name}
          </Link>
        </Heading>
        <p className="mt-1 text-[0.9375rem] leading-snug text-slate-700">
          {doctor.designation}
        </p>

        <div className="mt-auto pt-5">
          <div className="flex gap-2.5 rounded-lg bg-blue-50 px-3 py-2.5 text-[0.875rem] leading-snug text-slate-700">
            <Clock
              className="mt-0.5 size-4 shrink-0 text-blue-600"
              aria-hidden="true"
            />
            <div>
              <p>
                {doctor.opd_timings ? (
                  <>
                    <span className="font-semibold text-navy-950">
                      {m.doctors.opdLabel}:
                    </span>{' '}
                    {doctor.opd_timings}
                  </>
                ) : (
                  m.doctors.opdUnknown
                )}
              </p>
              <OpdStatusLine
                timings={doctor.opd_timings}
                className="mt-1 block font-semibold text-blue-700"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Doctors in one row that scrolls sideways: swipe on phones, arrow buttons on larger
 * screens. Cards stay full size instead of squeezing into narrow columns.
 */
export function DoctorRow({
  doctors,
  labelledBy,
}: {
  doctors: DoctorCardData[]
  labelledBy: string
}) {
  const list = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = list.current
    if (!el) return
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    const el = list.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  const scroll = (direction: 1 | -1) => {
    const el = list.current
    if (!el) return
    const card = el.querySelector('li')
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const arrow =
    'grid size-11 place-items-center rounded-full bg-white text-navy-950 shadow-tile ring-1 ring-slate-200 transition hover:bg-blue-600 hover:text-white hover:ring-blue-600 disabled:pointer-events-none disabled:opacity-40'

  return (
    <div>
      <ul
        ref={list}
        id="doctor-row"
        aria-labelledby={labelledBy}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] list-none gap-6 overflow-x-auto px-4 pt-2 pb-6 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {doctors.map((doctor, index) => (
          <li
            key={doctor.slug}
            className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-3rem)/2.4)] md:w-[calc((100%-3rem)/2.6)] lg:w-[calc((100%-4.5rem)/4)]"
            data-rise=""
            style={{ '--i': Math.min(index, 4) } as React.CSSProperties}
          >
            <DoctorCard doctor={doctor} eager={index < 4} />
          </li>
        ))}
      </ul>
      {edges.start && edges.end ? null : (
        <div className="mt-2 hidden justify-end gap-3 sm:flex">
          <button
            type="button"
            className={arrow}
            onClick={() => scroll(-1)}
            disabled={edges.start}
            aria-controls="doctor-row"
            aria-label={m.home.previousDoctors}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={arrow}
            onClick={() => scroll(1)}
            disabled={edges.end}
            aria-controls="doctor-row"
            aria-label={m.home.nextDoctors}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Doctors in a responsive grid (used on the doctors, department and treatment pages). */
export function DoctorGrid({
  doctors,
  headingLevel,
}: {
  doctors: DoctorCardData[]
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <ul className="grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {doctors.map((doctor, index) => (
        <li
          key={doctor.slug}
          data-rise=""
          style={{ '--i': index % 4 } as React.CSSProperties}
        >
          <DoctorCard
            doctor={doctor}
            eager={index < 4}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  )
}
