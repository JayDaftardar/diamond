import { notFound, redirect } from '@tanstack/react-router'
import { API_PUBLIC_URL } from '#/content/config'
import { m } from '#/lib/i18n'

/** Browser-side calls to the admin API. The session cookie is HttpOnly, so we only ask for it. */
const ADMIN_URL = `${API_PUBLIC_URL}/api/v1/admin`

export interface AdminUser {
  id: number
  email: string
}

export interface Dashboard {
  unread_submissions: number
  total_submissions: number
  treatments: { total: number; public: number; draft: number; hidden: number }
  doctors: { total: number; public: number; hidden: number }
  departments: { total: number; public: number; hidden: number }
}

export interface Submission {
  id: number
  name: string
  phone: string
  email: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface SubmissionPage {
  items: Array<Submission>
  total: number
  unread_total: number
  page: number
  page_size: number
}

export interface Department {
  id: number
  slug: string
  name: string
  summary: string | null
  intro_html: string | null
  sort_order: number
  is_hidden: boolean
  treatment_count: number
  updated_at: string
}

export interface Doctor {
  id: number
  slug: string
  name: string
  designation: string
  speciality: string
  qualifications: string | null
  training: string | null
  achievements: string | null
  expertise: Array<string>
  opd_timings: string | null
  photo_filename: string | null
  department_ids: Array<number>
  primary_department_id: number | null
  sort_order: number
  is_hidden: boolean
  updated_at: string
}

export type TreatmentStatus = 'public' | 'draft' | 'hidden'

export interface TreatmentListItem {
  id: number
  slug: string
  title: string
  department: { id: number; slug: string; name: string }
  is_hidden: boolean
  status: TreatmentStatus
  updated_at: string
}

export interface TreatmentPage {
  items: Array<TreatmentListItem>
  total: number
  page: number
  page_size: number
}

export interface Treatment extends TreatmentListItem {
  description_html: string | null
  youtube_video_id: string | null
  youtube_url: string | null
  presentation_url: string | null
  presentation_provider: string | null
  doctor_ids: Array<number>
}

export async function adminFetch(path: string, init: RequestInit = {}) {
  return fetch(`${ADMIN_URL}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
}

export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  /** Messages by form field, from a 422 response. */
  errors: Record<string, string>
  /** A readable message for the whole form. */
  message: string
}

/** Calls the admin API and never throws: network and server problems come back as `message`. */
export async function adminJson<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const { json, ...rest } = init
  try {
    const response = await adminFetch(path, {
      ...rest,
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
    })
    const body = (await response.json().catch(() => null)) as {
      detail?: unknown
      errors?: Record<string, string>
    } | null
    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        data: body as T | null,
        errors: {},
        message: '',
      }
    }
    return {
      ok: false,
      status: response.status,
      data: null,
      errors: body?.errors ?? {},
      message:
        typeof body?.detail === 'string' && !body.errors
          ? body.detail
          : m.admin.errorGeneric,
    }
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      errors: {},
      message: m.admin.errorNetwork,
    }
  }
}

/** For route loaders: the data, or a redirect to sign-in / a 404 / an error page. */
export async function loadAdmin<T>(path: string): Promise<T> {
  const result = await adminJson<T>(path)
  if (result.ok && result.data !== null) return result.data
  if (result.status === 401) throw redirect({ to: '/admin/login' })
  if (result.status === 404) throw notFound()
  throw new Error(result.message)
}

/** The signed-in admin, or null when there is no valid session. */
export async function fetchMe(): Promise<AdminUser | null> {
  const result = await adminJson<AdminUser>('/auth/me')
  return result.data
}

/** Time of day and date in the hospital's timezone, for lists and detail views. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso))
}

/** Turns a textarea with one item per line into a list, and back. */
export const linesToList = (text: string): Array<string> =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
export const listToLines = (list: Array<string>): string => list.join('\n')
