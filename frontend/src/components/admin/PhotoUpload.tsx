import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertIcon } from '#/components/Icon'
import { doctorPhotoSrc } from '#/components/Doctor'
import { adminJson } from '#/lib/admin'
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
    <div className="photo-upload">
      <span className="field__label" id="doc-photo-label">
        {t.photo}
      </span>
      <div className="photo-upload__body">
        <div className="photo-upload__preview">
          {src ? (
            <img
              src={src}
              alt={fmt(t.photoAlt, { name: doctor.name })}
              width={160}
              height={200}
            />
          ) : (
            <span className="muted small">{t.photoNone}</span>
          )}
        </div>
        <div className="photo-upload__controls">
          <p className="field__hint" id="doc-photo-hint">
            {t.photoHint}
          </p>
          <div className="button-row">
            {/* The real file input stays in the page (keyboard and screen readers reach it);
                the button just opens it. */}
            <input
              ref={input}
              id="doc-photo"
              className="visually-hidden"
              type="file"
              accept={ACCEPT}
              aria-labelledby="doc-photo-label"
              aria-describedby="doc-photo-hint"
              onChange={(event) => void upload(event)}
            />
            <button
              type="button"
              className="btn btn--quiet"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? t.photoUploading : src ? t.photoReplace : t.photoUpload}
            </button>
            {src ? (
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy}
                onClick={() => void remove()}
              >
                {t.photoRemove}
              </button>
            ) : null}
          </div>
          {notice ? (
            <p className="admin-saved" role="status">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="field__error" role="alert">
              <AlertIcon />
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
