import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  AdminHead,
  EmptyNote,
  FormAlert,
  Pager,
  StatusTag,
  adminRowClass,
} from '#/components/admin/AdminUi'
import { buttonClass } from '#/components/ui/button'
import { fieldControl } from '#/components/ui/field'
import { SelectField } from '#/components/admin/Fields'
import { adminJson, loadAdmin } from '#/lib/admin'
import type {
  Department,
  TreatmentListItem,
  TreatmentPage,
  TreatmentStatus,
} from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/treatments/')({
  ssr: false,
  loader: () => loadAdmin<Array<Department>>('/departments'),
  component: Treatments,
})

function Treatments() {
  const departments = Route.useLoaderData()
  const t = m.admin.treatments
  const c = m.admin.common

  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<TreatmentPage | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Reload whenever a filter or the page changes.
  useEffect(() => {
    let current = true
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('q', search)
    if (departmentId) params.set('department_id', departmentId)
    if (status) params.set('status', status)
    void adminJson<TreatmentPage>(`/treatments?${params.toString()}`).then(
      (result) => {
        if (!current) return
        if (result.ok) {
          setData(result.data)
          setError('')
        } else setError(result.message)
      },
    )
    return () => {
      current = false
    }
  }, [search, departmentId, status, page])

  async function toggle(item: TreatmentListItem) {
    setBusy(true)
    const result = await adminJson<TreatmentListItem>(
      `/treatments/${item.id}/visibility`,
      { method: 'PATCH', json: { is_hidden: !item.is_hidden } },
    )
    setBusy(false)
    if (result.ok && result.data) {
      const updated = result.data
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((i) => (i.id === updated.id ? updated : i)),
            }
          : d,
      )
    } else setError(result.message)
  }

  const statusLabel: Record<TreatmentStatus, string> = {
    public: t.statusPublicShort,
    draft: t.statusDraftShort,
    hidden: t.statusHiddenShort,
  }
  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1

  return (
    <>
      <AdminHead
        title={t.title}
        intro={
          data
            ? fmt(data.total === 1 ? t.countOne : t.count, {
                total: data.total,
              })
            : t.intro
        }
        action={
          <Link to="/admin/treatments/new" className={buttonClass('primary')}>
            {t.add}
          </Link>
        }
      />
      <p className="mb-6 max-w-2xl text-slate-700">{t.intro}</p>
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}

      <div className="mb-6 grid gap-4 rounded-2xl bg-white p-5 shadow-tile ring-1 ring-slate-200/70 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <form
          className="flex min-w-0 gap-2"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(query.trim())
            setPage(1)
          }}
        >
          <label className="sr-only" htmlFor="tr-search">
            {t.searchLabel}
          </label>
          <input
            id="tr-search"
            type="search"
            placeholder={t.searchLabel}
            value={query}
            className={`${fieldControl} h-12 min-w-0 flex-1`}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="submit"
            className={buttonClass('quiet', 'sm', 'h-12 shrink-0')}
          >
            {c.search}
          </button>
        </form>
        <SelectField
          id="tr-filter-department"
          label={t.department}
          value={departmentId}
          onChange={(value) => {
            setDepartmentId(value)
            setPage(1)
          }}
          options={[
            { value: '', label: c.all },
            ...departments.map((d) => ({ value: String(d.id), label: d.name })),
          ]}
        />
        <SelectField
          id="tr-filter-status"
          label={t.status}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          options={[
            { value: '', label: c.all },
            { value: 'public', label: t.statusPublic },
            { value: 'draft', label: t.statusDraft },
            { value: 'hidden', label: t.statusHidden },
          ]}
        />
      </div>

      {data === null ? null : data.items.length === 0 ? (
        <EmptyNote>{c.noResults}</EmptyNote>
      ) : (
        <ul className="grid list-none gap-3">
          {data.items.map((item) => (
            <li key={item.id} className={adminRowClass}>
              <div className="grid min-w-0 flex-1 basis-64 gap-0.5">
                <Link
                  to="/admin/treatments/$id"
                  params={{ id: String(item.id) }}
                  className="font-semibold text-navy-950 transition-colors hover:text-blue-600"
                >
                  {item.title}
                </Link>
                <span className="text-[0.9375rem] text-slate-700">
                  {item.department.name}
                </span>
              </div>
              <StatusTag tone={item.status}>
                {statusLabel[item.status]}
              </StatusTag>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass('quiet', 'sm')}
                  disabled={busy}
                  onClick={() => void toggle(item)}
                >
                  {item.is_hidden ? c.show : c.hide}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager page={page} pages={pages} onPage={setPage} />
    </>
  )
}
