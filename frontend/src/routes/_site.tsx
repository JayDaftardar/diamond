import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SiteLayout } from '#/components/layout/SiteLayout'
import { NowProvider } from '#/lib/now'

/**
 * Pathless layout: every public page is rendered inside the site chrome.
 * The loader stamps "now" so the server HTML and the first browser render show the same
 * clock and OPD statuses; the browser then keeps them current.
 */
export const Route = createFileRoute('/_site')({
  loader: () => ({ now: Date.now() }),
  component: SiteRoute,
})

function SiteRoute() {
  const { now } = Route.useLoaderData()
  return (
    <NowProvider initial={now}>
      <SiteLayout>
        <Outlet />
      </SiteLayout>
    </NowProvider>
  )
}
