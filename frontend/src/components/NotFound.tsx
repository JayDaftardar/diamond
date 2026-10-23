import { Link } from '@tanstack/react-router'
import { SiteLayout } from '#/components/layout/SiteLayout'
import { m } from '#/lib/i18n'

/** Shown for any address that does not exist (the server also answers with HTTP 404). */
export function NotFound() {
  return (
    <SiteLayout>
      <div className="page-head wrap">
        <div
          className="stack"
          style={{ '--stack': 'var(--s-5)' } as React.CSSProperties}
        >
          <h1>{m.notFound.title}</h1>
          <p className="statement">{m.notFound.body}</p>
          <Link to="/" className="btn btn--primary">
            {m.notFound.home}
          </Link>
        </div>
      </div>
    </SiteLayout>
  )
}
