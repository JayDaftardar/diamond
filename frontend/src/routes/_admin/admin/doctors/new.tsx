import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { DoctorForm } from '#/components/admin/DoctorForm'
import { loadAdmin } from '#/lib/admin'
import type { Department } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { freshData } from '#/lib/freshData'

export const Route = createFileRoute('/_admin/admin/doctors/new')({
  ssr: false,
  ...freshData,
  loader: () => loadAdmin<Array<Department>>('/departments'),
  component: NewDoctor,
})

function NewDoctor() {
  const departments = Route.useLoaderData()
  return (
    <>
      <BackLink to="/admin/doctors" />
      <AdminHead title={m.admin.doctors.newTitle} />
      <DoctorForm departments={departments} />
    </>
  )
}
