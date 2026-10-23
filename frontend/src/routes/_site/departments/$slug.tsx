import { createFileRoute, redirect } from '@tanstack/react-router'
import { DepartmentsView } from '#/components/departments/DepartmentsView'
import { EMERGENCY_PHONE } from '#/content/config'
import { fetchDepartment, fetchDepartments } from '#/lib/api'
import { breadcrumbJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { newSlugOrNotFound } from '#/lib/loaders'
import { buildHead } from '#/lib/seo'

/**
 * One department, at its own address (e.g. /departments/cardiology). The server renders it
 * with its own title, description and heading, so it can be found on Google by itself.
 */
export const Route = createFileRoute('/_site/departments/$slug')({
  loader: async ({ params }) => {
    const [departments, active] = await Promise.all([
      fetchDepartments(),
      fetchDepartment({ data: { slug: params.slug } }),
    ])
    if (!active) {
      const slug = await newSlugOrNotFound('department', params.slug)
      throw redirect({
        to: '/departments/$slug',
        params: { slug },
        statusCode: 301,
      })
    }
    return { departments, active }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { active } = loaderData
    return buildHead({
      title: fmt(m.departments.seoTitle, { name: active.name }),
      description:
        active.summary ??
        fmt(m.departments.metaDepartment, {
          name: active.name,
          number: EMERGENCY_PHONE.display,
        }),
      path: `/departments/${active.slug}`,
      jsonLd: [
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.departments.title, path: '/departments' },
          { name: active.name, path: `/departments/${active.slug}` },
        ]),
      ],
    })
  },
  component: DepartmentPage,
})

function DepartmentPage() {
  const { departments, active } = Route.useLoaderData()
  return (
    <DepartmentsView
      departments={departments}
      active={active}
      q=""
      results={null}
      all={[]}
    />
  )
}
