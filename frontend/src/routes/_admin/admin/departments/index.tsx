import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminHead, FormAlert, StatusTag } from '#/components/admin/AdminUi'
import { adminJson, loadAdmin } from '#/lib/admin'
import type { Department } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/departments/')({
  ssr: false,
  loader: () => loadAdmin<Array<Department>>('/departments'),
  component: Departments,
})

function Departments() {
  const loaded = Route.useLoaderData()
  const [items, setItems] = useState(loaded)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = m.admin.departments
  const c = m.admin.common

  async function move(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next) // show the new order straight away
    setBusy(true)
    setError('')
    const result = await adminJson<Array<Department>>('/departments/reorder', {
      method: 'PUT',
      json: { ids: next.map((d) => d.id) },
    })
    setBusy(false)
    if (result.ok && result.data) setItems(result.data)
    else {
      setItems(items)
      setError(t.reorderError)
    }
  }

  async function toggle(department: Department) {
    setBusy(true)
    setError('')
    const result = await adminJson<Department>(
      `/departments/${department.id}/visibility`,
      { method: 'PATCH', json: { is_hidden: !department.is_hidden } },
    )
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
          <Link to="/admin/departments/new" className="btn btn--primary">
            {t.add}
          </Link>
        }
      />
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}
      {items.length === 0 ? (
        <p className="empty-note">{c.empty}</p>
      ) : (
        <ol className="admin-list">
          {items.map((department, index) => (
            <li key={department.id} className="admin-row">
              <div className="admin-row__main">
                <Link
                  to="/admin/departments/$id"
                  params={{ id: String(department.id) }}
                >
                  {department.name}
                </Link>
                <span className="muted small">
                  {department.treatment_count === 1
                    ? t.treatmentsOne
                    : fmt(t.treatments, { count: department.treatment_count })}
                </span>
              </div>
              <StatusTag tone={department.is_hidden ? 'hidden' : 'public'}>
                {department.is_hidden ? c.hiddenLabel : c.visibleLabel}
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
                  onClick={() => void toggle(department)}
                >
                  {department.is_hidden ? c.show : c.hide}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
