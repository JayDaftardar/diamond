import { createFileRoute } from '@tanstack/react-router'
import { AdminHead, BackLink } from '#/components/admin/AdminUi'
import { TreatmentForm } from '#/components/admin/TreatmentForm'
import { loadAdmin } from '#/lib/admin'
import type { Department, Doctor } from '#/lib/admin'
import { m } from '#/lib/i18n'

export const Route = createFileRoute('/_admin/admin/treatments/new')({
  ssr: false,
  loader: async () => {
    const [departments, doctors] = await Promise.all([
      loadAdmin<Array<Department>>('/departments'),
      loadAdmin<Array<Doctor>>('/doctors'),
    ])
    return { departments, doctors }
  },
  component: NewTreatment,
})

function NewTreatment() {
  const { departments, doctors } = Route.useLoaderData()
  return (
    <>
      <BackLink to="/admin/treatments" />
      <AdminHead title={m.admin.treatments.newTitle} />
      <TreatmentForm departments={departments} doctors={doctors} />
    </>
  )
}
