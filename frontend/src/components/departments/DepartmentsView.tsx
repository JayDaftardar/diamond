import { Link } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { DoctorGrid } from '#/components/doctors/DoctorCard'
import { buttonClass } from '#/components/ui/button'
import { PageHead } from '#/components/ui/PageHead'
import { RICHTEXT } from '#/components/ui/richtext'
import { Container } from '#/components/ui/Section'
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
      <PageHead
        crumbs={
          active
            ? [
                { label: m.nav.home, to: '/' },
                { label: m.departments.title, to: '/departments' },
                { label: active.name },
              ]
            : [{ label: m.nav.home, to: '/' }, { label: m.departments.title }]
        }
        eyebrow={m.departments.eyebrow}
        title={heading}
        intro={
          active
            ? (active.summary ??
              fmt(m.departments.introDepartment, { name: active.name }))
            : m.departments.intro
        }
      >
        <SearchBox q={q} live={!active} />
      </PageHead>

      <div className="border-b border-slate-200 py-5">
        <Container>
          <DepartmentTabs departments={departments} />
        </Container>
      </div>

      <section className="py-14 lg:py-20" id="department-panel">
        <Container className="grid gap-16 lg:gap-20">
          {results ? (
            <SearchResults q={q} results={results} />
          ) : active ? (
            <DepartmentPanel department={active} />
          ) : (
            <AllPanel all={all} departments={departments} />
          )}
        </Container>
      </section>
    </>
  )
}

/** A block with its own heading: the heading above, the content below. */
function Block({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h2
        className="mb-8 font-heading text-[1.75rem] leading-tight font-semibold text-balance text-navy-950 sm:text-[2rem]"
        data-rise=""
        style={{ '--i': 1 } as CSSProperties}
      >
        {title}
      </h2>
      {children}
    </div>
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
    <div aria-live="polite">
      <Block title={fmt(m.departments.resultsFor, { q })}>
        {results.length > 0 ? (
          <TreatmentList treatments={results} showDepartment />
        ) : (
          <div className="grid max-w-xl gap-6">
            <p className="text-lead text-slate-700">
              {fmt(m.departments.noResults, { q, ...phone })}
            </p>
            <div>
              <Link
                to="/departments"
                search={{}}
                className={buttonClass('soft')}
              >
                {m.departments.clearSearch}
              </Link>
            </div>
          </div>
        )}
      </Block>
    </div>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p
      className="max-w-2xl rounded-2xl bg-blue-50 px-6 py-5 text-lead text-slate-700"
      data-rise=""
    >
      {children}
    </p>
  )
}

function DepartmentPanel({ department }: { department: DepartmentDetail }) {
  return (
    <>
      {department.intro_html ? (
        // Sanitised on the server when the admin saves it.
        <div
          className={`${RICHTEXT} max-w-3xl`}
          data-rise=""
          dangerouslySetInnerHTML={{ __html: department.intro_html }}
        />
      ) : null}

      <Block title={m.departments.treatmentsTitle}>
        {department.treatments.length > 0 ? (
          <TreatmentList treatments={department.treatments} />
        ) : (
          <EmptyNote>
            {fmt(m.departments.empty, { name: department.name, ...phone })}
          </EmptyNote>
        )}
      </Block>

      {department.doctors.length > 0 ? (
        <Block
          title={fmt(m.departments.doctorsTitle, { name: department.name })}
        >
          <DoctorGrid doctors={department.doctors} />
        </Block>
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
      <Block title={m.departments.allTreatmentsTitle}>
        <EmptyNote>{fmt(m.departments.emptyAll, phone)}</EmptyNote>
      </Block>
    )
  }
  return (
    <>
      {groups.map(({ department, items }) => (
        <Block
          key={department.slug}
          title={
            <Link
              to="/departments/$slug"
              params={{ slug: department.slug }}
              className="transition-colors hover:text-blue-600"
            >
              {department.name}
            </Link>
          }
        >
          <TreatmentList treatments={items} />
        </Block>
      ))}
    </>
  )
}
