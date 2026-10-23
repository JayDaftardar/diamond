import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AlertIcon } from '#/components/Icon'
import { fmt, m } from '#/lib/i18n'

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
    <div className="admin-head">
      <div>
        <h1>{title}</h1>
        {intro ? <p className="muted">{intro}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** Red alert above a form (or a list) when something failed. */
export function FormAlert({ title, text }: { title: string; text: string }) {
  return (
    <div className="form-alert" role="alert">
      <AlertIcon />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
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
        className="btn btn--danger"
        onClick={() => setAsking(true)}
      >
        {t.delete}
      </button>
    )
  }
  return (
    <div className="confirm" role="alertdialog" aria-label={t.delete}>
      <p>{fmt(t.confirmDelete, { name })}</p>
      <div className="button-row">
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? t.deleting : t.confirmYes}
        </button>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => setAsking(false)}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  )
}

/** Status pill used in lists: public, draft, hidden. */
export function StatusTag({
  tone,
  children,
}: {
  tone: 'public' | 'draft' | 'hidden'
  children: ReactNode
}) {
  return <span className={`status status--${tone}`}>{children}</span>
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
    <nav className="pager" aria-label={t.pagination}>
      <button
        type="button"
        className="btn btn--quiet"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {t.previous}
      </button>
      <span>{fmt(t.pageOf, { page, pages })}</span>
      <button
        type="button"
        className="btn btn--quiet"
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
    <Link to={to} className="admin-back">
      {m.admin.common.back}
    </Link>
  )
}
