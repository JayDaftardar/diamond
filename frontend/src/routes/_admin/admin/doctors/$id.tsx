import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { DoctorForm } from '#/components/admin/DoctorForm'
import { loadAdmin } from '#/lib/admin'
import type { Department, Doctor } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { freshData } from '#/lib/freshData'

export const Route = createFileRoute('/_admin/admin/doctors/$id')({
  ssr: false,
  ...freshData,
  loader: async ({ params }) => {
    const [doctor, departments] = await Promise.all([
      loadAdmin<Doctor>(`/doctors/${params.id}`),
      loadAdmin<Array<Department>>('/departments'),
    ])
    return { doctor, departments }
  },
  component: EditDoctor,
})

function EditDoctor() {
  const { doctor, departments } = Route.useLoaderData()
  return (
    <>
      <BackLink to="/admin/doctors" />
      <AdminHead title={m.admin.doctors.editTitle} />
      <DoctorForm key={doctor.id} initial={doctor} departments={departments} />
    </>
  )
}
