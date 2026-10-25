import { API_PUBLIC_URL } from '#/content/config'

/** Full address of a doctor's photo (photos are served by the API from the database). */
export function doctorPhotoSrc(photoUrl: string | null): string | null {
  return photoUrl ? `${API_PUBLIC_URL}${photoUrl}` : null
}
