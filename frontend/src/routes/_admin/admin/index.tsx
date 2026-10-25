import { Link, createFileRoute } from '@tanstack/react-router'
import { AdminHead, FormAlert } from '#/components/admin/AdminUi'
import { adminFetch } from '#/lib/admin'
import type { Dashboard } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'
import { freshData } from '#/lib/freshData'

export const Route = createFileRoute('/_admin/admin/')({
  ssr: false,
  ...freshData,
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
      <AdminHead title={m.admin.dashboardTitle} />
      {data ? (
        <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <FormAlert title={m.admin.errorTitle} text={m.admin.loadError} />
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
    <li className="group relative grid gap-1 rounded-2xl bg-white p-6 shadow-tile ring-1 ring-slate-200/70 transition duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* The label is the link; it stretches over the whole card. */}
      <Link
        to={to}
        className="text-eyebrow font-bold text-blue-600 uppercase after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-3 focus-visible:after:outline-blue-600"
      >
        {label}
      </Link>
      <strong className="font-heading text-[2.5rem] leading-none font-semibold text-navy-950 tabular-nums">
        {value}
      </strong>
      <span className="text-[0.9375rem] text-slate-700">{detail}</span>
    </li>
  )
}
