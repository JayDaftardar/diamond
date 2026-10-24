import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { TreatmentItem } from '#/lib/types'

/** Treatments as a two-column index of rows; each opens its own treatment page. */
export function TreatmentList({
  treatments,
  showDepartment,
}: {
  treatments: TreatmentItem[]
  /** Show each treatment's department (used in search results). */
  showDepartment?: boolean
}) {
  return (
    <ul className="grid list-none sm:grid-cols-2 sm:gap-x-10">
      {treatments.map((treatment, index) => (
        <li
          key={treatment.slug}
          className="border-b border-slate-200 first:border-t sm:[&:nth-child(2)]:border-t"
          data-rise=""
          style={{ '--i': index % 2 } as React.CSSProperties}
        >
          <Link
            to="/treatments/$slug"
            params={{ slug: treatment.slug }}
            className="group flex items-start justify-between gap-4 py-4"
          >
            <span>
              <span className="block font-heading text-[1.0625rem] leading-snug font-semibold text-navy-950 transition-colors group-hover:text-blue-600">
                {treatment.title}
              </span>
              {showDepartment ? (
                <span className="mt-0.5 block text-[0.9375rem] text-slate-700">
                  {treatment.department.name}
                </span>
              ) : null}
            </span>
            <ArrowRight
              className="mt-1 size-5 shrink-0 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-blue-600 motion-reduce:group-hover:translate-x-0"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
