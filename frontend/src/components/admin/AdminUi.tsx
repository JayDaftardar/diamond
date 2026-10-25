import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { buttonClass } from '#/components/ui/button'
import { fmt, m } from '#/lib/i18n'

/** The white card every create / edit form sits in. */
export const adminFormClass =
  'grid max-w-3xl gap-6 rounded-2xl bg-white p-6 shadow-tile ring-1 ring-slate-200/70 sm:p-8'

/** Page title with an optional action button on the right. */
export function AdminHead({
  title,
  intro,
  action,
}: {
  title: string
  intro?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[1.875rem] leading-tight font-semibold text-navy-950 sm:text-[2.25rem]">
          {title}
        </h1>
        {intro ? (
          <p className="mt-2 max-w-2xl text-slate-700">{intro}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

/** Red alert above a form (or a list) when something failed. */
export function FormAlert({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="flex gap-3 rounded-xl bg-red-50 p-4 text-red-700 ring-1 ring-red-600/30"
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <strong className="block font-semibold">{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  )
}

/** "Saved." note after a successful save. */
export function SavedNote({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded-lg bg-blue-50 px-4 py-3 font-semibold text-blue-700 ring-1 ring-blue-600/20"
      role="status"
    >
      {children}
    </p>
  )
}

/** Delete with a confirmation step, so one stray click cannot remove content. */
export function DeleteButton({
  name,
  busy,
  onConfirm,
}: {
  name: string
  busy: boolean
  onConfirm: () => void
}) {
  const [asking, setAsking] = useState(false)
  const t = m.admin.common

  if (!asking) {
    return (
      <button
        type="button"
        className={buttonClass('danger', 'sm')}
        onClick={() => setAsking(true)}
      >
        {t.delete}
      </button>
    )
  }
  return (
    <div
      className="grid gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-600/30"
      role="alertdialog"
      aria-label={t.delete}
    >
      <p className="font-medium text-red-700">
        {fmt(t.confirmDelete, { name })}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonClass('emergency', 'sm')}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? t.deleting : t.confirmYes}
        </button>
        <button
          type="button"
          className={buttonClass('quiet', 'sm')}
          onClick={() => setAsking(false)}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  )
}

const TONES = {
  public: 'bg-blue-50 text-blue-700 ring-blue-600/25',
  draft: 'bg-slate-100 text-slate-700 ring-slate-300',
  hidden: 'bg-navy-950 text-white ring-navy-950',
  unread: 'bg-blue-600 text-white ring-blue-600',
}

/** Status pill used in lists: public, draft, hidden, unread. */
export function StatusTag({
  tone,
  children,
}: {
  tone: keyof typeof TONES
  children: ReactNode
}) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.8125rem] leading-none font-semibold ring-1 ring-inset',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}

/** Previous / next with the current page, for the long lists. */
export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number
  pages: number
  onPage: (page: number) => void
}) {
  const t = m.admin.common
  if (pages <= 1) return null
  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-4"
      aria-label={t.pagination}
    >
      <button
        type="button"
        className={buttonClass('quiet', 'sm')}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {t.previous}
      </button>
      <span className="text-slate-700">{fmt(t.pageOf, { page, pages })}</span>
      <button
        type="button"
        className={buttonClass('quiet', 'sm')}
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        {t.next}
      </button>
    </nav>
  )
}

/** "Back to list" link at the top of every edit page. */
export function BackLink({
  to,
}: {
  to: '/admin/treatments' | '/admin/doctors' | '/admin/departments'
}) {
  return (
    <Link
      to={to}
      className="mb-5 inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {m.admin.common.back}
    </Link>
  )
}

/** A white row card in the admin lists. */
export const adminRowClass =
  'flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-white px-5 py-4 shadow-tile ring-1 ring-slate-200/70'

/** The empty-list message. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-white px-5 py-6 text-slate-700 ring-1 ring-slate-200/70">
      {children}
    </p>
  )
}
