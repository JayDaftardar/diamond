import { useRouter } from '@tanstack/react-router'
import { PhoneIcon } from '#/components/Icon'
import { SiteLayout } from '#/components/layout/SiteLayout'
import { EMERGENCY_PHONE } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

/** Shown when a page fails to load (for example the API is unreachable). */
export function ErrorPage() {
  const router = useRouter()
  return (
    <SiteLayout>
      <div className="page-head wrap">
        <div
          className="stack"
          style={{ '--stack': 'var(--s-5)' } as React.CSSProperties}
        >
          <h1>{m.error.title}</h1>
          <p className="statement">{m.error.body}</p>
          <div className="button-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void router.invalidate()}
            >
              {m.error.retry}
            </button>
            <a className="btn btn--emergency" href={EMERGENCY_PHONE.href}>
              <PhoneIcon />
              {fmt(m.home.callCta, { number: EMERGENCY_PHONE.display })}
            </a>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
