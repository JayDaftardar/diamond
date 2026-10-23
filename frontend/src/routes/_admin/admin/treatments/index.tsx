import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  AdminHead,
  FormAlert,
  Pager,
  StatusTag,
} from '#/components/admin/AdminUi'
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
          <Link to="/admin/treatments/new" className="btn btn--primary">
            {t.add}
          </Link>
        }
      />
      <p className="muted">{t.intro}</p>
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}

      <div className="admin-filters">
        <form
          className="admin-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(query.trim())
            setPage(1)
          }}
        >
          <label className="visually-hidden" htmlFor="tr-search">
            {t.searchLabel}
          </label>
          <input
            id="tr-search"
            type="search"
            placeholder={t.searchLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn--quiet">
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
        <p className="empty-note">{c.noResults}</p>
      ) : (
        <ul className="admin-list">
          {data.items.map((item) => (
            <li key={item.id} className="admin-row">
              <div className="admin-row__main">
                <Link
                  to="/admin/treatments/$id"
                  params={{ id: String(item.id) }}
                >
                  {item.title}
                </Link>
                <span className="muted small">{item.department.name}</span>
              </div>
              <StatusTag tone={item.status}>
                {statusLabel[item.status]}
              </StatusTag>
              <div className="admin-row__actions">
                <button
                  type="button"
                  className="btn btn--quiet"
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
