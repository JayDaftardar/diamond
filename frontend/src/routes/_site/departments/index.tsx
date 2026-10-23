import { createFileRoute } from '@tanstack/react-router'
import { DepartmentsView } from '#/components/departments/DepartmentsView'
import { fetchDepartments, fetchTreatments } from '#/lib/api'
import { breadcrumbJsonLd } from '#/lib/jsonld'
import { m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/departments/')({
  // The search text lives in the address (?q=...), so results can be shared and bookmarked.
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === 'string' ? search.q.trim().slice(0, 100) : ''
    return q ? { q } : {}
  },
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: async ({ deps }) => {
    const [departments, treatments] = await Promise.all([
      fetchDepartments(),
      fetchTreatments({ data: { q: deps.q } }),
    ])
    return { departments, treatments, q: deps.q ?? '' }
  },
  head: ({ loaderData }) =>
    buildHead({
      title: m.departments.title,
      description: m.departments.description,
      // Search results are not separate pages for Google: keep the canonical clean.
      path: '/departments',
      noindex: Boolean(loaderData?.q),
      jsonLd: [
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.departments.title, path: '/departments' },
        ]),
      ],
    }),
  component: DepartmentsIndex,
})

function DepartmentsIndex() {
  const { departments, treatments, q } = Route.useLoaderData()
  return (
    <DepartmentsView
      departments={departments}
      active={null}
      q={q}
      results={q ? treatments : null}
      all={treatments}
    />
  )
}
