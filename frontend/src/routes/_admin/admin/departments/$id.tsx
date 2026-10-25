import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { DepartmentForm } from '#/components/admin/DepartmentForm'
import { loadAdmin } from '#/lib/admin'
import type { Department } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { freshData } from '#/lib/freshData'

export const Route = createFileRoute('/_admin/admin/departments/$id')({
  ssr: false,
  ...freshData,
  loader: ({ params }) => loadAdmin<Department>(`/departments/${params.id}`),
  component: EditDepartment,
})

function EditDepartment() {
  const department = Route.useLoaderData()
  return (
    <>
      <BackLink to="/admin/departments" />
      <AdminHead title={m.admin.departments.editTitle} />
      <DepartmentForm key={department.id} initial={department} />
    </>
  )
}
