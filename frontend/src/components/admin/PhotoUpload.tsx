import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { buttonClass } from '#/components/ui/button'
import { doctorPhotoSrc } from '#/components/Doctor'
import { adminJson } from '#/lib/admin'
import { FieldError } from './Fields'
import { SavedNote } from './AdminUi'
import type { Doctor } from '#/lib/admin'
import { fmt, m } from '#/lib/i18n'

const MAX_BYTES = 8 * 1024 * 1024 // same limit as the server
const ACCEPT = 'image/jpeg,image/png,image/webp'

/**
 * A doctor's photo: shows the current one, uploads a replacement straight away, or removes it.
 * The server checks and re-encodes every upload, so this only does a quick size check first.
 */
export function PhotoUpload({
  doctor,
  onChange,
}: {
  doctor: Doctor
  onChange: (updated: Doctor) => void
}) {
  const t = m.admin.doctors
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const src = doctorPhotoSrc(doctor.photo_url)

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again after an error
    if (!file) return
    setError('')
    setNotice('')
    if (file.size > MAX_BYTES) {
      setError(t.photoTooLarge)
      return
    }
    setBusy(true)
    const result = await adminJson<Doctor>(`/doctors/${doctor.id}/photo`, {
      method: 'PUT',
      body: file,
      headers: { 'content-type': file.type || 'application/octet-stream' },
    })
    setBusy(false)
    if (result.ok && result.data) {
      onChange(result.data)
      setNotice(t.photoSaved)
    } else {
      setError('photo' in result.errors ? result.errors.photo : result.message)
    }
  }

  async function remove() {
    setBusy(true)
    setError('')
    setNotice('')
    const result = await adminJson<Doctor>(`/doctors/${doctor.id}/photo`, {
      method: 'DELETE',
    })
    setBusy(false)
    if (result.ok && result.data) {
      onChange(result.data)
      setNotice(t.photoRemoved)
    } else setError(result.message)
  }

  return (
    <div className="grid gap-2">
      <span className="font-semibold text-navy-950" id="doc-photo-label">
        {t.photo}
      </span>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="grid aspect-[4/5] w-40 place-items-center overflow-hidden rounded-xl bg-blue-50 p-2 text-center ring-1 ring-slate-200 has-[img]:p-0">
          {src ? (
            <img
              src={src}
              alt={fmt(t.photoAlt, { name: doctor.name })}
              width={160}
              height={200}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-[0.9375rem] text-slate-700">
              {t.photoNone}
            </span>
          )}
        </div>
        <div className="grid min-w-0 flex-1 basis-64 gap-3">
          <p className="text-[0.9375rem] text-slate-700" id="doc-photo-hint">
            {t.photoHint}
          </p>
          <div className="flex flex-wrap gap-3">
            {/* The real file input stays in the page (keyboard and screen readers reach it);
                the button just opens it. */}
            <input
              ref={input}
              id="doc-photo"
              className="sr-only"
              type="file"
              accept={ACCEPT}
              aria-labelledby="doc-photo-label"
              aria-describedby="doc-photo-hint"
              onChange={(event) => void upload(event)}
            />
            <button
              type="button"
              className={buttonClass('quiet', 'sm')}
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? t.photoUploading : src ? t.photoReplace : t.photoUpload}
            </button>
            {src ? (
              <button
                type="button"
                className={buttonClass('danger', 'sm')}
                disabled={busy}
                onClick={() => void remove()}
              >
                {t.photoRemove}
              </button>
            ) : null}
          </div>
          {notice ? <SavedNote>{notice}</SavedNote> : null}
          {error ? <FieldError>{error}</FieldError> : null}
        </div>
      </div>
    </div>
  )
}
