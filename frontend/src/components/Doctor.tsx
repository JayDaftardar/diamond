import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from '#/components/Icon'
import { OpdStatusLine } from '#/components/OpdStatus'
import { DOCTOR_PHOTOS } from '#/content/doctor-photos'
import { fmt, m } from '#/lib/i18n'
import type { DoctorCardData } from '#/lib/types'

/** Portrait of a doctor, or a neutral silhouette until their photo file is added. */
export function DoctorPhoto({
  doctor,
  eager,
}: {
  doctor: Pick<DoctorCardData, 'name' | 'designation' | 'photo_filename'>
  eager?: boolean
}) {
  const file = doctor.photo_filename
  const hasPhoto = file !== null && DOCTOR_PHOTOS.includes(file)

  return (
    <div className="doctor-photo">
      {hasPhoto ? (
        <img
          src={`/images/doctors/${file}`}
          alt={fmt(m.doctors.photoAlt, {
            name: doctor.name,
            designation: doctor.designation,
          })}
          width={400}
          height={500}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">
          <circle cx="40" cy="36" r="16" fill="currentColor" />
          <path d="M8 100c0-22 14-34 32-34s32 12 32 34Z" fill="currentColor" />
        </svg>
      )}
    </div>
  )
}

/**
 * Doctor card: photo, name, designation, speciality and OPD timings (with today's status
 * when the timings can be read). The whole card links to the doctor's profile.
 */
export function DoctorCard({
  doctor,
  eager,
}: {
  doctor: DoctorCardData
  eager?: boolean
}) {
  return (
    <li className="card doctor-card" data-rise="">
      <DoctorPhoto doctor={doctor} eager={eager} />
      <div className="doctor-card__body">
        <h3 className="doctor-card__name">
          <Link to="/doctors/$slug" params={{ slug: doctor.slug }}>
            {doctor.name}
          </Link>
        </h3>
        <p className="doctor-card__role">{doctor.designation}</p>
        <p className="muted small">{doctor.speciality}</p>
        <p className="doctor-card__opd small">
          {doctor.opd_timings ? (
            <>
              <strong>{m.doctors.opdLabel}:</strong> {doctor.opd_timings}
            </>
          ) : (
            m.doctors.opdUnknown
          )}
        </p>
        <OpdStatusLine timings={doctor.opd_timings} className="opd-status" />
        <span className="card__more" aria-hidden="true">
          {m.doctors.viewProfile}
          <ChevronRightIcon />
        </span>
      </div>
    </li>
  )
}

/** A responsive grid of doctor cards. */
export function DoctorGrid({ doctors }: { doctors: DoctorCardData[] }) {
  return (
    <ul className="card-grid card-grid--doctors">
      {doctors.map((doctor, index) => (
        <DoctorCard key={doctor.slug} doctor={doctor} eager={index < 3} />
      ))}
    </ul>
  )
}
