import { createFileRoute } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AdminHead,
  DeleteButton,
  EmptyNote,
  FormAlert,
  Pager,
  StatusTag,
} from '#/components/admin/AdminUi'
import { buttonClass } from '#/components/ui/button'
import { fieldControl } from '#/components/ui/field'
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-tile ring-1 ring-slate-200/70">
        <div
          className="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-300 ring-inset"
          role="group"
          aria-label={c.filter}
        >
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              className="min-h-11 px-4 font-semibold text-slate-700 transition-colors hover:bg-blue-50 aria-pressed:bg-navy-950 aria-pressed:text-white"
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
          className="flex min-w-0 basis-full gap-2 sm:max-w-md sm:flex-1 sm:basis-72"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(query.trim())
            setPage(1)
          }}
        >
          <label className="sr-only" htmlFor="msg-search">
            {t.searchLabel}
          </label>
          <input
            id="msg-search"
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
      </div>

      {data === null ? null : data.items.length === 0 ? (
        <EmptyNote>
          {search || filter !== 'all' ? c.noResults : t.empty}
        </EmptyNote>
      ) : (
        <ul className="grid list-none gap-3">
          {data.items.map((submission) => {
            const isOpen = open === submission.id
            return (
              <li
                key={submission.id}
                className={clsx(
                  'min-w-0 overflow-hidden rounded-xl bg-white shadow-tile ring-1 ring-slate-200/70',
                  !submission.is_read && 'border-l-4 border-blue-600',
                )}
              >
                <button
                  type="button"
                  className="flex w-full min-w-0 flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  aria-expanded={isOpen}
                  onClick={() => void toggle(submission)}
                >
                  <span className="grid basis-full gap-0.5 sm:basis-56">
                    <strong className="text-navy-950">{submission.name}</strong>
                    <span className="text-[0.9375rem] text-slate-700">
                      {formatDateTime(submission.created_at)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 basis-full truncate text-slate-700 sm:basis-40">
                    {submission.message}
                  </span>
                  {submission.is_read ? null : (
                    <StatusTag tone="unread">{t.unread}</StatusTag>
                  )}
                </button>
                {isOpen ? (
                  <div className="grid gap-5 border-t border-slate-200 px-5 py-5">
                    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      <Fact label={t.from}>{submission.name}</Fact>
                      <Fact label={t.phone}>
                        <a
                          href={`tel:${submission.phone}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {submission.phone}
                        </a>
                      </Fact>
                      {submission.email ? (
                        <Fact label={t.email}>
                          <a
                            href={`mailto:${submission.email}`}
                            className="font-semibold break-all text-blue-600 hover:underline"
                          >
                            {submission.email}
                          </a>
                        </Fact>
                      ) : null}
                      <Fact label={t.received}>
                        {formatDateTime(submission.created_at)}
                      </Fact>
                    </dl>
                    <p className="rounded-xl bg-slate-50 p-4 break-words whitespace-pre-wrap text-navy-950">
                      {submission.message}
                    </p>
                    <div className="flex flex-wrap items-start gap-3">
                      <button
                        type="button"
                        className={buttonClass('quiet', 'sm')}
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

/** One labelled detail of a message (sender, phone, email, time). */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-eyebrow font-bold text-blue-600 uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-navy-950">{children}</dd>
    </div>
  )
}
