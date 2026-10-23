import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { DOCTOR_PHOTOS } from '#/content/doctor-photos'
import { adminJson, linesToList, listToLines } from '#/lib/admin'
import type { Department, Doctor } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { DeleteButton, FormAlert } from './AdminUi'
import {
  Check,
  CheckGroup,
  SelectField,
  TextAreaField,
  TextField,
} from './Fields'

/** The request body the API expects for a doctor, built from a loaded doctor. */
export function doctorInput(doctor: Doctor, overrides: Partial<Doctor> = {}) {
  const d = { ...doctor, ...overrides }
  return {
    name: d.name,
    slug: d.slug,
    designation: d.designation,
    speciality: d.speciality,
    qualifications: d.qualifications,
    training: d.training,
    achievements: d.achievements,
    expertise: d.expertise,
    opd_timings: d.opd_timings,
    photo_filename: d.photo_filename,
    department_ids: d.department_ids,
    primary_department_id: d.primary_department_id,
    sort_order: d.sort_order,
    is_hidden: d.is_hidden,
  }
}

/** Create or edit a doctor. Pass `initial` to edit. */
export function DoctorForm({
  initial,
  departments,
}: {
  initial?: Doctor
  departments: Array<Department>
}) {
  const navigate = useNavigate()
  const t = m.admin.doctors
  const c = m.admin.common

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [designation, setDesignation] = useState(initial?.designation ?? '')
  const [speciality, setSpeciality] = useState(initial?.speciality ?? '')
  const [qualifications, setQualifications] = useState(
    initial?.qualifications ?? '',
  )
  const [training, setTraining] = useState(initial?.training ?? '')
  const [achievements, setAchievements] = useState(initial?.achievements ?? '')
  const [expertise, setExpertise] = useState(
    listToLines(initial?.expertise ?? []),
  )
  const [opd, setOpd] = useState(initial?.opd_timings ?? '')
  const [photo, setPhoto] = useState(initial?.photo_filename ?? '')
  const [departmentIds, setDepartmentIds] = useState<Array<number>>(
    initial?.department_ids ?? [],
  )
  const [primaryId, setPrimaryId] = useState(
    initial?.primary_department_id ? String(initial.primary_department_id) : '',
  )
  const [hidden, setHidden] = useState(initial?.is_hidden ?? false)

  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  function toggleDepartment(id: number, on: boolean) {
    setDepartmentIds((current) =>
      on ? [...current, id] : current.filter((value) => value !== id),
    )
  }

  // The main department must be one of the chosen ones; fall back to the first.
  const primary = departmentIds.includes(Number(primaryId))
    ? Number(primaryId)
    : (departmentIds.at(0) ?? null)

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setErrors({})
    setSaved(false)
    const result = await adminJson<Doctor>(
      initial ? `/doctors/${initial.id}` : '/doctors',
      {
        method: initial ? 'PUT' : 'POST',
        json: {
          name,
          slug,
          designation,
          speciality,
          qualifications,
          training,
          achievements,
          expertise: linesToList(expertise),
          opd_timings: opd,
          photo_filename: photo,
          department_ids: departmentIds,
          primary_department_id: primary,
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
      await navigate({ to: '/admin/doctors' })
    }
  }

  async function remove() {
    if (!initial) return
    setBusy(true)
    const result = await adminJson(`/doctors/${initial.id}`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (result.ok) await navigate({ to: '/admin/doctors' })
    else setMessage(result.message)
  }

  // Keep a saved file selectable even if it was removed from the folder.
  const photoFiles =
    photo && !DOCTOR_PHOTOS.includes(photo)
      ? [photo, ...DOCTOR_PHOTOS]
      : DOCTOR_PHOTOS
  const photoOptions = [
    { value: '', label: t.photoNone },
    ...photoFiles.map((file) => ({ value: file, label: file })),
  ]

  return (
    <form className="admin-form stack" onSubmit={save} noValidate>
      {message || Object.keys(errors).length > 0 ? (
        <FormAlert title={c.formErrorTitle} text={message || c.formErrorFix} />
      ) : null}
      {saved ? (
        <p className="admin-saved" role="status">
          {c.saved}
        </p>
      ) : null}

      <TextField
        id="doc-name"
        label={t.name}
        value={name}
        onChange={setName}
        error={errors.name}
        maxLength={160}
        required
      />
      <TextField
        id="doc-slug"
        label={c.slug}
        hint={initial ? c.slugHintEdit : c.slugHintNew}
        value={slug}
        onChange={setSlug}
        error={errors.slug}
        maxLength={120}
      />
      <TextField
        id="doc-designation"
        label={t.designation}
        hint={t.designationHint}
        value={designation}
        onChange={setDesignation}
        error={errors.designation}
        maxLength={200}
        required
      />
      <TextField
        id="doc-speciality"
        label={t.speciality}
        value={speciality}
        onChange={setSpeciality}
        error={errors.speciality}
        maxLength={200}
        required
      />
      <TextField
        id="doc-qualifications"
        label={t.qualifications}
        value={qualifications}
        onChange={setQualifications}
        error={errors.qualifications}
        maxLength={1000}
      />
      <TextAreaField
        id="doc-opd"
        label={t.opd}
        hint={t.opdHint}
        value={opd}
        onChange={setOpd}
        error={errors.opd_timings}
        rows={2}
        maxLength={300}
      />
      <SelectField
        id="doc-photo"
        label={t.photo}
        hint={t.photoHint}
        value={photo}
        onChange={setPhoto}
        error={errors.photo_filename}
        options={photoOptions}
      />

      <CheckGroup
        legend={t.departments}
        hint={t.departmentsHint}
        error={errors.department_ids}
      >
        {departments.map((department) => (
          <Check
            key={department.id}
            label={department.name}
            checked={departmentIds.includes(department.id)}
            onChange={(on) => toggleDepartment(department.id, on)}
          />
        ))}
      </CheckGroup>
      {departmentIds.length > 1 ? (
        <SelectField
          id="doc-primary"
          label={t.primary}
          value={primary === null ? '' : String(primary)}
          onChange={setPrimaryId}
          error={errors.primary_department_id}
          options={departments
            .filter((department) => departmentIds.includes(department.id))
            .map((department) => ({
              value: String(department.id),
              label: department.name,
            }))}
        />
      ) : null}

      <TextAreaField
        id="doc-training"
        label={t.training}
        hint={t.trainingHint}
        value={training}
        onChange={setTraining}
        error={errors.training}
        maxLength={2000}
      />
      <TextAreaField
        id="doc-achievements"
        label={t.achievements}
        hint={t.achievementsHint}
        value={achievements}
        onChange={setAchievements}
        error={errors.achievements}
        maxLength={2000}
      />
      <TextAreaField
        id="doc-expertise"
        label={t.expertise}
        hint={t.expertiseHint}
        value={expertise}
        onChange={setExpertise}
        error={errors.expertise}
        maxLength={3000}
      />
      <Check label={c.hiddenLabel} checked={hidden} onChange={setHidden} />

      <div className="admin-actions">
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? c.saving : initial ? c.save : c.create}
        </button>
        {initial ? (
          <DeleteButton
            name={initial.name}
            busy={busy}
            onConfirm={() => void remove()}
          />
        ) : null}
      </div>
    </form>
  )
}
