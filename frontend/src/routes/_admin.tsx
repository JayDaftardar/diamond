import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { buttonClass } from '#/components/ui/button'
import { Container } from '#/components/ui/Section'
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
  const tabs = useRef<HTMLUListElement>(null)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  // On a phone the tabs scroll sideways: keep the current one in view (sideways only).
  useEffect(() => {
    const row = tabs.current
    const current = row?.querySelector<HTMLElement>('[data-status="active"]')
    if (!row || !current || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({
      left: current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2,
    })
  }, [pathname])

  async function signOut() {
    await adminFetch('/auth/logout', { method: 'POST' }).catch(() => null)
    await navigate({ to: '/admin/login' })
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <Link
            to="/admin"
            className="font-heading text-xl font-bold text-navy-950"
          >
            {m.admin.siteName}
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            <span className="hidden min-w-0 truncate text-[0.9375rem] text-slate-700 md:block">
              {fmt(m.admin.signedInAs, { email: admin.email })}
            </span>
            <a
              href="/"
              className="font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
            >
              {m.admin.viewSite}
            </a>
            <button
              type="button"
              className={buttonClass('quiet', 'sm')}
              onClick={signOut}
            >
              {m.admin.signOut}
            </button>
          </div>
        </Container>
        <nav aria-label={m.admin.nav.label}>
          <Container>
            <ul
              ref={tabs}
              className="-mx-4 flex [scrollbar-width:none] list-none gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {NAV.map((item) => (
                <li key={item.to} className="shrink-0">
                  <Link
                    to={item.to}
                    activeOptions={{ exact: item.to === '/admin' }}
                    className="relative block px-3 py-3 font-semibold text-slate-700 transition-colors hover:text-navy-950 data-[status=active]:text-blue-600 data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:bottom-0 data-[status=active]:after:h-0.5 data-[status=active]:after:rounded-full data-[status=active]:after:bg-blue-600"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      </header>
      <main className="py-8 lg:py-10">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  )
}
