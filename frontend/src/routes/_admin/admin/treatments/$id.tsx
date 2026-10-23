import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { TreatmentForm } from '#/components/admin/TreatmentForm'
import { loadAdmin } from '#/lib/admin'
import type { Department, Doctor, Treatment } from '#/lib/admin'
import { m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/treatments/$id')({
  ssr: false,
  loader: async ({ params }) => {
    const [treatment, departments, doctors] = await Promise.all([
      loadAdmin<Treatment>(`/treatments/${params.id}`),
      loadAdmin<Array<Department>>('/departments'),
      loadAdmin<Array<Doctor>>('/doctors'),
    ])
    return { treatment, departments, doctors }
  },
  component: EditTreatment,
})

function EditTreatment() {
  const { treatment, departments, doctors } = Route.useLoaderData()
  return (
    <>
      <BackLink to="/admin/treatments" />
      <AdminHead title={m.admin.treatments.editTitle} />
      <TreatmentForm
        key={treatment.id}
        initial={treatment}
        departments={departments}
        doctors={doctors}
      />
    </>
  )
}
