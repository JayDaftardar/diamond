import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  AdminHead,
  DeleteButton,
  FormAlert,
  Pager,
  StatusTag,
} from '#/components/admin/AdminUi'
import { adminJson, formatDateTime } from '#/lib/admin'
import type { Submission, SubmissionPage } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

type Filter = 'all' | 'unread' | 'read'

export const Route = createFileRoute('/_admin/admin/submissions/')({
  ssr: false,
  component: Messages,
})

function Messages() {
  const t = m.admin.messages
  const c = m.admin.common
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SubmissionPage | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Reload whenever the filter, search or page changes.
  useEffect(() => {
    let current = true
    const params = new URLSearchParams({ page: String(page) })
    if (filter !== 'all') params.set('read', String(filter === 'read'))
    if (search) params.set('q', search)
    void adminJson<SubmissionPage>(`/submissions?${params.toString()}`).then(
      (result) => {
        if (!current) return
        if (result.ok) setData(result.data)
        else setError(result.message)
      },
    )
    return () => {
      current = false
    }
  }, [filter, search, page])

  function replace(updated: Submission) {
    setData((d) =>
      d
        ? {
            ...d,
            unread_total:
              d.unread_total +
              (d.items.find((s) => s.id === updated.id)?.is_read ===
              updated.is_read
                ? 0
                : updated.is_read
                  ? -1
                  : 1),
            items: d.items.map((s) => (s.id === updated.id ? updated : s)),
          }
        : d,
    )
  }

  async function setRead(submission: Submission, isRead: boolean) {
    setBusy(true)
    const result = await adminJson<Submission>(
      `/submissions/${submission.id}`,
      { method: 'PATCH', json: { is_read: isRead } },
    )
    setBusy(false)
    if (result.ok && result.data) replace(result.data)
    else setError(result.message)
  }

  async function toggle(submission: Submission) {
    const opening = open !== submission.id
    setOpen(opening ? submission.id : null)
    // Opening a message marks it as read.
    if (opening && !submission.is_read) await setRead(submission, true)
  }

  async function remove(submission: Submission) {
    setBusy(true)
    const result = await adminJson(`/submissions/${submission.id}`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (result.ok) {
      setOpen(null)
      setData((d) =>
        d
          ? {
              ...d,
              total: d.total - 1,
              unread_total: d.unread_total - (submission.is_read ? 0 : 1),
              items: d.items.filter((s) => s.id !== submission.id),
            }
          : d,
      )
    } else setError(result.message)
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: t.filterAll },
    { key: 'unread', label: t.filterUnread },
    { key: 'read', label: t.filterRead },
  ]

  return (
    <>
      <AdminHead
        title={t.title}
        intro={
          data
            ? fmt(data.total === 1 ? t.countOne : t.count, {
                total: data.total,
                unread: data.unread_total,
              })
            : t.intro
        }
      />
      {error ? <FormAlert title={c.formErrorTitle} text={error} /> : null}

      <div className="admin-filters">
        <div className="segmented" role="group" aria-label={c.filter}>
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => {
                setFilter(item.key)
                setPage(1)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form
          className="admin-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(query.trim())
            setPage(1)
          }}
        >
          <label className="visually-hidden" htmlFor="msg-search">
            {t.searchLabel}
          </label>
          <input
            id="msg-search"
            type="search"
            placeholder={t.searchLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn--quiet">
            {c.search}
          </button>
        </form>
      </div>

      {data === null ? null : data.items.length === 0 ? (
        <p className="empty-note">
          {search || filter !== 'all' ? c.noResults : t.empty}
        </p>
      ) : (
        <ul className="admin-list">
          {data.items.map((submission) => {
            const isOpen = open === submission.id
            return (
              <li
                key={submission.id}
                className={`admin-row admin-row--message${submission.is_read ? '' : ' is-unread'}`}
              >
                <button
                  type="button"
                  className="admin-row__toggle"
                  aria-expanded={isOpen}
                  onClick={() => void toggle(submission)}
                >
                  <span className="admin-row__main">
                    <strong>{submission.name}</strong>
                    <span className="muted small">
                      {formatDateTime(submission.created_at)}
                    </span>
                  </span>
                  <span className="admin-row__preview">
                    {submission.message}
                  </span>
                  {submission.is_read ? null : (
                    <StatusTag tone="draft">{t.unread}</StatusTag>
                  )}
                </button>
                {isOpen ? (
                  <div className="admin-message">
                    <dl className="admin-facts">
                      <div>
                        <dt>{t.from}</dt>
                        <dd>{submission.name}</dd>
                      </div>
                      <div>
                        <dt>{t.phone}</dt>
                        <dd>
                          <a href={`tel:${submission.phone}`}>
                            {submission.phone}
                          </a>
                        </dd>
                      </div>
                      {submission.email ? (
                        <div>
                          <dt>{t.email}</dt>
                          <dd>
                            <a href={`mailto:${submission.email}`}>
                              {submission.email}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt>{t.received}</dt>
                        <dd>{formatDateTime(submission.created_at)}</dd>
                      </div>
                    </dl>
                    <p className="admin-message__text">{submission.message}</p>
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="btn btn--quiet"
                        disabled={busy}
                        onClick={() =>
                          void setRead(submission, !submission.is_read)
                        }
                      >
                        {submission.is_read ? t.markUnread : t.markRead}
                      </button>
                      <DeleteButton
                        name={submission.name}
                        busy={busy}
                        onConfirm={() => void remove(submission)}
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      <Pager page={page} pages={pages} onPage={setPage} />
    </>
  )
}
