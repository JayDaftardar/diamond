import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { adminJson } from '#/lib/admin'
import type { Department } from '#/lib/admin'
import { m } from '#/lib/i18n'
import { DeleteButton, FormAlert } from './AdminUi'
import { Check, TextAreaField, TextField } from './Fields'
import { RichText } from './RichText'

/** Create or edit a department. Pass `initial` to edit. */
export function DepartmentForm({ initial }: { initial?: Department }) {
  const navigate = useNavigate()
  const t = m.admin.departments
  const c = m.admin.common

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [intro, setIntro] = useState(initial?.intro_html ?? '')
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
    const result = await adminJson<Department>(
      initial ? `/departments/${initial.id}` : '/departments',
      {
        method: initial ? 'PUT' : 'POST',
        json: {
          name,
          slug,
          summary,
          intro_html: intro,
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
      await navigate({ to: '/admin/departments' })
    }
  }

  async function remove() {
    if (!initial) return
    setBusy(true)
    const result = await adminJson(`/departments/${initial.id}`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (result.ok) await navigate({ to: '/admin/departments' })
    else setMessage(result.message)
  }

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
        id="dept-name"
        label={t.name}
        value={name}
        onChange={setName}
        error={errors.name}
        maxLength={160}
        required
      />
      <TextField
        id="dept-slug"
        label={c.slug}
        hint={initial ? c.slugHintEdit : c.slugHintNew}
        value={slug}
        onChange={setSlug}
        error={errors.slug}
        maxLength={120}
      />
      <TextAreaField
        id="dept-summary"
        label={t.summary}
        hint={t.summaryHint}
        value={summary}
        onChange={setSummary}
        error={errors.summary}
        rows={2}
        maxLength={300}
      />
      <RichText
        id="dept-intro"
        label={t.introField}
        hint={t.introHint}
        value={intro}
        onChange={setIntro}
        error={errors.intro_html}
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
