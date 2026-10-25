import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AdminHead,
  EmptyNote,
  FormAlert,
  StatusTag,
  adminRowClass,
} from '#/components/admin/AdminUi'
import { buttonClass } from '#/components/ui/button'
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
          <Link to="/admin/departments/new" className={buttonClass('primary')}>
            {t.add}
          </Link>
        }
      />
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}
      {items.length === 0 ? (
        <EmptyNote>{c.empty}</EmptyNote>
      ) : (
        <ol className="grid list-none gap-3">
          {items.map((department, index) => (
            <li key={department.id} className={adminRowClass}>
              <div className="grid min-w-0 flex-1 basis-64 gap-0.5">
                <Link
                  to="/admin/departments/$id"
                  params={{ id: String(department.id) }}
                  className="font-semibold text-navy-950 transition-colors hover:text-blue-600"
                >
                  {department.name}
                </Link>
                <span className="text-[0.9375rem] text-slate-700">
                  {department.treatment_count === 1
                    ? t.treatmentsOne
                    : fmt(t.treatments, { count: department.treatment_count })}
                </span>
              </div>
              <StatusTag tone={department.is_hidden ? 'hidden' : 'public'}>
                {department.is_hidden ? c.hiddenLabel : c.visibleLabel}
              </StatusTag>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass('quiet', 'sm')}
                  disabled={busy || index === 0}
                  onClick={() => void move(index, -1)}
                >
                  {t.moveUp}
                </button>
                <button
                  type="button"
                  className={buttonClass('quiet', 'sm')}
                  disabled={busy || index === items.length - 1}
                  onClick={() => void move(index, 1)}
                >
                  {t.moveDown}
                </button>
                <button
                  type="button"
                  className={buttonClass('quiet', 'sm')}
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
