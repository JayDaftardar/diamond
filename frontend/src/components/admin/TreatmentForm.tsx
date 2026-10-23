import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { adminJson } from '#/lib/admin'
import type { Department, Doctor, Treatment } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { DeleteButton, FormAlert } from './AdminUi'
import { Check, CheckGroup, SelectField, TextField } from './Fields'
import { RichText } from './RichText'

/** Create or edit a treatment. Pass `initial` to edit. */
export function TreatmentForm({
  initial,
  departments,
  doctors,
}: {
  initial?: Treatment
  departments: Array<Department>
  doctors: Array<Doctor>
}) {
  const navigate = useNavigate()
  const t = m.admin.treatments
  const c = m.admin.common

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [departmentId, setDepartmentId] = useState(
    String(initial?.department.id ?? departments.at(0)?.id ?? ''),
  )
  const [description, setDescription] = useState(
    initial?.description_html ?? '',
  )
  const [youtube, setYoutube] = useState(initial?.youtube_url ?? '')
  const [presentation, setPresentation] = useState(
    initial?.presentation_url ?? '',
  )
  const [doctorIds, setDoctorIds] = useState<Array<number>>(
    initial?.doctor_ids ?? [],
  )
  const [hidden, setHidden] = useState(initial?.is_hidden ?? false)

  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setErrors({})
    setSaved(false)
    const result = await adminJson<Treatment>(
      initial ? `/treatments/${initial.id}` : '/treatments',
      {
        method: initial ? 'PUT' : 'POST',
        json: {
          title,
          slug,
          department_id: Number(departmentId),
          description_html: description,
          youtube_url: youtube,
          presentation_url: presentation,
          doctor_ids: doctorIds,
          is_hidden: hidden,
        },
      },
    )
    setBusy(false)
    if (!result.ok) {
      setErrors(result.errors)
      setMessage(result.message)
      return
    }
    if (initial) {
      if (result.data) setSlug(result.data.slug)
      setSaved(true)
    } else {
      await navigate({ to: '/admin/treatments' })
    }
  }

  async function remove() {
    if (!initial) return
    setBusy(true)
    const result = await adminJson(`/treatments/${initial.id}`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (result.ok) await navigate({ to: '/admin/treatments' })
    else setMessage(result.message)
  }

  return (
    <form className="admin-form stack" onSubmit={save} noValidate>
      {message || Object.keys(errors).length > 0 ? (
        <FormAlert title={c.formErrorTitle} text={message || c.formErrorFix} />
      ) : null}
      {saved ? (
        <p className="admin-saved" role="status">
          {c.saved}{' '}
          {initial ? (
            <Link to="/treatments/$slug" params={{ slug }}>
              {t.viewOnSite}
            </Link>
          ) : null}
        </p>
      ) : null}

      <TextField
        id="tr-title"
        label={t.titleField}
        value={title}
        onChange={setTitle}
        error={errors.title}
        maxLength={200}
        required
      />
      <SelectField
        id="tr-department"
        label={t.department}
        value={departmentId}
        onChange={setDepartmentId}
        error={errors.department_id}
        options={departments.map((department) => ({
          value: String(department.id),
          label: department.name,
        }))}
        required
      />
      <TextField
        id="tr-slug"
        label={c.slug}
        hint={initial ? c.slugHintEdit : c.slugHintNew}
        value={slug}
        onChange={setSlug}
        error={errors.slug}
        maxLength={120}
      />
      <RichText
        id="tr-description"
        label={t.description}
        hint={t.descriptionHint}
        value={description}
        onChange={setDescription}
        error={errors.description_html}
      />
      <TextField
        id="tr-youtube"
        label={t.youtube}
        hint={t.youtubeHint}
        value={youtube}
        onChange={setYoutube}
        error={errors.youtube_url}
        maxLength={300}
      />
      <TextField
        id="tr-presentation"
        label={t.presentation}
        hint={t.presentationHint}
        value={presentation}
        onChange={setPresentation}
        error={errors.presentation_url}
        maxLength={1000}
      />
      <CheckGroup
        legend={t.doctors}
        hint={t.doctorsHint}
        error={errors.doctor_ids}
      >
        {doctors.map((doctor) => (
          <Check
            key={doctor.id}
            label={doctor.name}
            checked={doctorIds.includes(doctor.id)}
            onChange={(on) =>
              setDoctorIds((current) =>
                on
                  ? [...current, doctor.id]
                  : current.filter((id) => id !== doctor.id),
              )
            }
          />
        ))}
      </CheckGroup>
      <Check label={c.hiddenLabel} checked={hidden} onChange={setHidden} />

      <div className="admin-actions">
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? c.saving : initial ? c.save : c.create}
        </button>
        {initial ? (
          <DeleteButton
            name={initial.title}
            busy={busy}
            onConfirm={() => void remove()}
          />
        ) : null}
      </div>
    </form>
  )
}
