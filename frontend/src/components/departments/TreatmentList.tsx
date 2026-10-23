import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from '#/components/Icon'
import type { TreatmentItem } from '#/lib/types'

/** Treatments as a list of rows; each opens its own treatment page. */
export function TreatmentList({
  treatments,
  showDepartment,
}: {
  treatments: TreatmentItem[]
  /** Show each treatment's department (used in search results). */
  showDepartment?: boolean
}) {
  return (
    <ul className="rows">
      {treatments.map((treatment, index) => (
        <li
          key={treatment.slug}
          data-rise=""
          style={{ '--i': index % 6 } as React.CSSProperties}
        >
          <Link to="/treatments/$slug" params={{ slug: treatment.slug }}>
            <span>
              {treatment.title}
              {showDepartment ? (
                <span className="rows__meta">{treatment.department.name}</span>
              ) : null}
            </span>
            <ChevronRightIcon />
          </Link>
        </li>
      ))}
    </ul>
  )
}
