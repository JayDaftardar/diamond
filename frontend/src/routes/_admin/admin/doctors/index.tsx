import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminHead, FormAlert, StatusTag } from '#/components/admin/AdminUi'
import { doctorInput } from '#/components/admin/DoctorForm'
import { adminJson, loadAdmin } from '#/lib/admin'
import type { Department, Doctor } from '#/lib/admin'
import { m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/doctors/')({
  ssr: false,
  loader: async () => {
    const [doctors, departments] = await Promise.all([
      loadAdmin<Array<Doctor>>('/doctors'),
      loadAdmin<Array<Department>>('/departments'),
    ])
    return { doctors, departments }
  },
  component: Doctors,
})

function Doctors() {
  const loaded = Route.useLoaderData()
  const [items, setItems] = useState(loaded.doctors)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = m.admin.doctors
  const c = m.admin.common
  const departmentName = new Map(loaded.departments.map((d) => [d.id, d.name]))

  /** Swap two doctors' positions by exchanging their sort numbers. */
  async function move(index: number, by: -1 | 1) {
    const other = index + by
    if (other < 0 || other >= items.length) return
    const a = items[index]
    const b = items[other]
    setBusy(true)
    setError('')
    const [first, second] = await Promise.all([
      adminJson<Doctor>(`/doctors/${a.id}`, {
        method: 'PUT',
        json: doctorInput(a, { sort_order: b.sort_order }),
      }),
      adminJson<Doctor>(`/doctors/${b.id}`, {
        method: 'PUT',
        json: doctorInput(b, { sort_order: a.sort_order }),
      }),
    ])
    setBusy(false)
    if (first.ok && second.ok && first.data && second.data) {
      const next = [...items]
      next[index] = second.data
      next[other] = first.data
      next.sort((x, y) => x.sort_order - y.sort_order || x.id - y.id)
      setItems(next)
    } else setError(first.message || second.message)
  }

  async function toggle(doctor: Doctor) {
    setBusy(true)
    setError('')
    const result = await adminJson<Doctor>(`/doctors/${doctor.id}/visibility`, {
      method: 'PATCH',
      json: { is_hidden: !doctor.is_hidden },
    })
    setBusy(false)
    if (result.ok && result.data) {
      const updated = result.data
      setItems((current) =>
        current.map((d) => (d.id === updated.id ? updated : d)),
      )
    } else setError(result.message)
  }

  return (
    <>
      <AdminHead
        title={t.title}
        intro={t.intro}
        action={
          <Link to="/admin/doctors/new" className="btn btn--primary">
            {t.add}
          </Link>
        }
      />
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}
      {items.length === 0 ? (
        <p className="empty-note">{c.empty}</p>
      ) : (
        <ol className="admin-list">
          {items.map((doctor, index) => (
            <li key={doctor.id} className="admin-row">
              <div className="admin-row__main">
                <Link
                  to="/admin/doctors/$id"
                  params={{ id: String(doctor.id) }}
                >
                  {doctor.name}
                </Link>
                <span className="muted small">{doctor.designation}</span>
                <span className="muted small">
                  {doctor.department_ids
                    .map((id) => departmentName.get(id))
                    .filter(Boolean)
                    .join(', ')}
                </span>
                <span className="muted small">
                  {doctor.opd_timings ?? t.noOpd}
                </span>
              </div>
              <StatusTag tone={doctor.is_hidden ? 'hidden' : 'public'}>
                {doctor.is_hidden ? c.hiddenLabel : c.visibleLabel}
              </StatusTag>
              <div className="admin-row__actions">
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                >
                  {t.moveUp}
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy || index === items.length - 1}
                  onClick={() => void move(index, 1)}
                >
                  {t.moveDown}
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  disabled={busy}
                  onClick={() => void toggle(doctor)}
                >
                  {doctor.is_hidden ? c.show : c.hide}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
