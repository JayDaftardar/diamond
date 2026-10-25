/** Shapes returned by the public API (mirror backend/app/schemas/public.py). */

export interface DepartmentRef {
  slug: string
  name: string
}

export interface DoctorDepartmentRef extends DepartmentRef {
  is_primary: boolean
}

export interface DoctorCardData {
  slug: string
  name: string
  designation: string
  speciality: string
  opd_timings: string | null
  /** Photo address relative to the API, with a version for caching; null = silhouette. */
  photo_url: string | null
}

export interface TreatmentItem {
  slug: string
  title: string
  department: DepartmentRef
}

export interface DepartmentListItem {
  slug: string
  name: string
  summary: string | null
  treatment_count: number
  /** Public doctors in this department, in display order. */
  doctor_names: string[]
}

export interface DepartmentDetail extends DepartmentListItem {
  intro_html: string | null
  treatments: TreatmentItem[]
  doctors: DoctorCardData[]
}

export interface DoctorDetail extends DoctorCardData {
  qualifications: string | null
  training: string[]
  achievements: string[]
  expertise: string[]
  departments: DoctorDepartmentRef[]
  treatments: TreatmentItem[]
}

export interface TreatmentDetail {
  slug: string
  title: string
  department: DepartmentRef
  description_html: string
  youtube_video_ids: string[]
  presentation_embed_urls: string[]
  updated_at: string
  doctors: DoctorCardData[]
}

export type EntityType = 'department' | 'doctor' | 'treatment'

/** One page in the sitemap list the API returns. */
export interface SitemapEntry {
  slug: string
  updated_at: string
}

export interface SitemapEntries {
  departments: SitemapEntry[]
  doctors: SitemapEntry[]
  treatments: SitemapEntry[]
}
