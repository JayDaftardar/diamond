import { Link, createFileRoute } from '@tanstack/react-router'
import { adminFetch } from '#/lib/admin'
import type { Dashboard } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/')({
  ssr: false,
  loader: async (): Promise<Dashboard | null> => {
    const response = await adminFetch('/dashboard')
    return response.ok ? ((await response.json()) as Dashboard) : null
  },
  component: DashboardPage,
})

function DashboardPage() {
  const data = Route.useLoaderData()
  const t = m.admin.cards

  return (
    <>
      <h1>{m.admin.dashboardTitle}</h1>
      {data ? (
        <ul className="card-grid admin-stats">
          <Stat
            to="/admin/submissions"
            label={t.submissions}
            value={data.total_submissions}
            detail={fmt(t.unread, { count: data.unread_submissions })}
          />
          <Stat
            to="/admin/treatments"
            label={t.treatments}
            value={data.treatments.total}
            detail={fmt(t.treatmentsDetail, {
              public: data.treatments.public,
              draft: data.treatments.draft,
              hidden: data.treatments.hidden,
            })}
          />
          <Stat
            to="/admin/doctors"
            label={t.doctors}
            value={data.doctors.total}
            detail={fmt(t.visibility, {
              public: data.doctors.public,
              hidden: data.doctors.hidden,
            })}
          />
          <Stat
            to="/admin/departments"
            label={t.departments}
            value={data.departments.total}
            detail={fmt(t.visibility, {
              public: data.departments.public,
              hidden: data.departments.hidden,
            })}
          />
        </ul>
      ) : (
        <p role="alert">{m.admin.loadError}</p>
      )}
    </>
  )
}

function Stat({
  to,
  label,
  value,
  detail,
}: {
  to:
    | '/admin/submissions'
    | '/admin/treatments'
    | '/admin/doctors'
    | '/admin/departments'
  label: string
  value: number
  detail: string
}) {
  return (
    <li className="card admin-stat">
      <Link to={to} className="admin-stat__label">
        {label}
      </Link>
      <strong className="admin-stat__value">{value}</strong>
      <span className="muted small">{detail}</span>
    </li>
  )
}
