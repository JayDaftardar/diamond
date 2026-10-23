import { Link } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { DoctorGrid } from '#/components/Doctor'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import type {
  DepartmentDetail,
  DepartmentListItem,
  TreatmentItem,
} from '#/lib/types'
import { DepartmentTabs } from './DepartmentTabs'
import { SearchBox } from './SearchBox'
import { TreatmentList } from './TreatmentList'

interface DepartmentsViewProps {
  departments: DepartmentListItem[]
  /** The selected department, or null for the "All" view. */
  active: DepartmentDetail | null
  /** Search text from the address (only on /departments). */
  q: string
  /** Search results; null when not searching. */
  results: TreatmentItem[] | null
  /** Every public treatment, for the "All" view. */
  all: TreatmentItem[]
}

const phone = { number: EMERGENCY_PHONE.display }

/** Group treatments by department, keeping the department order given. */
function groupByDepartment(
  treatments: TreatmentItem[],
  departments: DepartmentListItem[],
) {
  return departments
    .map((department) => ({
      department,
      items: treatments.filter((t) => t.department.slug === department.slug),
    }))
    .filter((group) => group.items.length > 0)
}

/**
 * The single "Departments and treatments" page. It renders at /departments (all) and at
 * /departments/<slug> (one department), each a separate, server-rendered address.
 */
export function DepartmentsView({
  departments,
  active,
  q,
  results,
  all,
}: DepartmentsViewProps) {
  const heading = active
    ? fmt(m.departments.h1Department, { name: active.name })
    : m.departments.h1

  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={
            active
              ? [
                  { label: m.nav.home, to: '/' },
                  { label: m.departments.title, to: '/departments' },
                  { label: active.name },
                ]
              : [{ label: m.nav.home, to: '/' }, { label: m.departments.title }]
          }
        />
        <h1 data-rise="">{heading}</h1>
        <p
          className="statement"
          data-rise=""
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {active
            ? (active.summary ??
              fmt(m.departments.introDepartment, { name: active.name }))
            : m.departments.intro}
        </p>
        <div data-rise="" style={{ '--i': 2 } as React.CSSProperties}>
          <SearchBox q={q} live={!active} />
        </div>
      </section>

      <div className="wrap">
        <DepartmentTabs departments={departments} />
      </div>

      <section className="section dept-panel" id="department-panel">
        <div className="wrap">
          {results ? (
            <SearchResults q={q} results={results} />
          ) : active ? (
            <DepartmentPanel department={active} />
          ) : (
            <AllPanel all={all} departments={departments} />
          )}
        </div>
      </section>
    </>
  )
}

function SearchResults({
  q,
  results,
}: {
  q: string
  results: TreatmentItem[]
}) {
  return (
    <div className="split" aria-live="polite">
      <h2 data-rise="">{fmt(m.departments.resultsFor, { q })}</h2>
      <div>
        {results.length > 0 ? (
          <TreatmentList treatments={results} showDepartment />
        ) : (
          <div className="stack">
            <p>{fmt(m.departments.noResults, { q, ...phone })}</p>
            <p>
              <Link to="/departments" search={{}} className="btn btn--quiet">
                {m.departments.clearSearch}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DepartmentPanel({ department }: { department: DepartmentDetail }) {
  return (
    <>
      {department.intro_html ? (
        <div className="split dept-panel__block">
          {/* Sanitised on the server when the admin saves it. */}
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: department.intro_html }}
          />
        </div>
      ) : null}

      <div className="split dept-panel__block">
        <h2 data-rise="">{m.departments.treatmentsTitle}</h2>
        <div>
          {department.treatments.length > 0 ? (
            <TreatmentList treatments={department.treatments} />
          ) : (
            <p className="empty-note" data-rise="">
              {fmt(m.departments.empty, { name: department.name, ...phone })}
            </p>
          )}
        </div>
      </div>

      {department.doctors.length > 0 ? (
        <div className="split dept-panel__block">
          <h2 data-rise="">
            {fmt(m.departments.doctorsTitle, { name: department.name })}
          </h2>
          <DoctorGrid doctors={department.doctors} />
        </div>
      ) : null}
    </>
  )
}

function AllPanel({
  all,
  departments,
}: {
  all: TreatmentItem[]
  departments: DepartmentListItem[]
}) {
  const groups = groupByDepartment(all, departments)
  if (groups.length === 0) {
    return (
      <div className="split">
        <h2 data-rise="">{m.departments.allTreatmentsTitle}</h2>
        <p
          className="empty-note"
          data-rise=""
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {fmt(m.departments.emptyAll, phone)}
        </p>
      </div>
    )
  }
  return (
    <>
      {groups.map(({ department, items }) => (
        <div key={department.slug} className="split dept-panel__group">
          <h2 data-rise="">
            <Link to="/departments/$slug" params={{ slug: department.slug }}>
              {department.name}
            </Link>
          </h2>
          <TreatmentList treatments={items} />
        </div>
      ))}
    </>
  )
}
