import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { buttonClass } from '#/components/ui/button'
import { adminJson } from '#/lib/admin'
import type { Department, Doctor, Treatment } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { DeleteButton, FormAlert, SavedNote, adminFormClass } from './AdminUi'
import { Check, CheckGroup, SelectField, TextField } from './Fields'
import { LinkList } from './LinkList'
import { RichText } from './RichText'

const MAX_MEDIA = 10 // same limit as the server

/** At least one box, so there is always somewhere to paste a link. */
const slots = (links: Array<string> | undefined) =>
  links?.length ? links : ['']

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
  // The page address, made by the server from the title; used for the "View on website" link.
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [departmentId, setDepartmentId] = useState(
    String(initial?.department.id ?? departments.at(0)?.id ?? ''),
  )
  const [description, setDescription] = useState(
    initial?.description_html ?? '',
  )
  const [videos, setVideos] = useState(() => slots(initial?.youtube_urls))
  const [presentations, setPresentations] = useState(() =>
    slots(initial?.presentation_urls),
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
          department_id: Number(departmentId),
          description_html: description,
          youtube_urls: videos,
          presentation_urls: presentations,
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
    <form className={adminFormClass} onSubmit={save} noValidate>
      {message || Object.keys(errors).length > 0 ? (
        <FormAlert
          title={c.formErrorTitle}
          text={Object.keys(errors).length > 0 ? c.formErrorFix : message}
        />
      ) : null}
      {saved ? (
        <SavedNote>
          {c.saved}{' '}
          {initial ? (
            <Link
              to="/treatments/$slug"
              params={{ slug }}
              className="underline underline-offset-4 hover:text-blue-600"
            >
              {t.viewOnSite}
            </Link>
          ) : null}
        </SavedNote>
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
      <RichText
        id="tr-description"
        label={t.description}
        hint={t.descriptionHint}
        value={description}
        onChange={setDescription}
        error={errors.description_html}
      />
      <LinkList
        id="tr-youtube"
        name="youtube_urls"
        legend={t.youtube}
        hint={t.youtubeHint}
        slotLabel={t.youtubeSlot}
        addLabel={t.addVideo}
        values={videos}
        onChange={setVideos}
        errors={errors}
        max={MAX_MEDIA}
        maxLength={300}
      />
      <LinkList
        id="tr-presentation"
        name="presentation_urls"
        legend={t.presentation}
        hint={t.presentationHint}
        slotLabel={t.presentationSlot}
        addLabel={t.addPresentation}
        values={presentations}
        onChange={setPresentations}
        errors={errors}
        max={MAX_MEDIA}
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

      <div className="flex flex-wrap items-start gap-3 border-t border-slate-200 pt-6">
        <button
          className={buttonClass('primary')}
          type="submit"
          disabled={busy}
        >
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
