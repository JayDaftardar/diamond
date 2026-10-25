import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { DepartmentForm } from '#/components/admin/DepartmentForm'
import { m } from '#/lib/i18n'
import { freshData } from '#/lib/freshData'

export const Route = createFileRoute('/_admin/admin/departments/new')({
  ssr: false,
  ...freshData,
  component: () => (
    <>
      <BackLink to="/admin/departments" />
      <AdminHead title={m.admin.departments.newTitle} />
      <DepartmentForm />
    </>
  ),
})
