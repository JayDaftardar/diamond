import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { adminFetch, fetchMe } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

/**
 * Pathless layout for every signed-in admin page. It runs in the browser only (the session
 * cookie is not available to the server render) and sends visitors without a session to
 * the sign-in page.
 */
export const Route = createFileRoute('/_admin')({
  ssr: false,
  beforeLoad: async () => {
    const admin = await fetchMe()
    if (!admin) throw redirect({ to: '/admin/login' })
    return { admin }
  },
  head: () => ({
    meta: [
      { title: m.admin.siteName },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminLayout,
})

const NAV = [
  { to: '/admin', label: m.admin.nav.dashboard },
  { to: '/admin/submissions', label: m.admin.nav.messages },
  { to: '/admin/treatments', label: m.admin.nav.treatments },
  { to: '/admin/doctors', label: m.admin.nav.doctors },
  { to: '/admin/departments', label: m.admin.nav.departments },
] as const

function AdminLayout() {
  const { admin } = Route.useRouteContext()
  const navigate = useNavigate()

  async function signOut() {
    await adminFetch('/auth/logout', { method: 'POST' }).catch(() => null)
    await navigate({ to: '/admin/login' })
  }

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="wrap admin-bar__inner">
          <Link to="/admin" className="admin-bar__name">
            {m.admin.siteName}
          </Link>
          <span className="admin-bar__user">
            {fmt(m.admin.signedInAs, { email: admin.email })}
          </span>
          <a href="/" className="admin-bar__link">
            {m.admin.viewSite}
          </a>
          <button type="button" className="btn btn--quiet" onClick={signOut}>
            {m.admin.signOut}
          </button>
        </div>
      </header>
      <nav className="admin-nav" aria-label={m.admin.nav.label}>
        <ul className="wrap">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === '/admin' }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="wrap admin-main">
        <Outlet />
      </main>
    </div>
  )
}
