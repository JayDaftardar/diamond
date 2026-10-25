import { createServerFn } from '@tanstack/react-start'
import type {
  DepartmentDetail,
  DepartmentListItem,
  DoctorCardData,
  DoctorDetail,
  EntityType,
  SitemapEntries,
  TreatmentDetail,
  TreatmentItem,
} from '#/lib/types'

/**
 * Public API calls. Each one is a server function: it always runs on the server (during
 * page rendering AND when a visitor navigates in the browser), so the API's internal
 * address is never exposed and the browser needs no CORS access for page data.
 *
 * Missing items come back as null so a route can answer with notFound() or a redirect;
 * any other failure throws and shows the error page.
 */

function apiBase(): string {
  return (process.env.API_INTERNAL_URL ?? 'http://localhost:8000').replace(
    /\/$/,
    '',
  )
}

async function get<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T | null> {
  const url = new URL(`${apiBase()}/api/v1/public${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) url.searchParams.set(key, value)
  }
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`API ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

/** Like get(), for lists that always exist. */
async function getList<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T[]> {
  return (await get<T[]>(path, params)) ?? []
}

const slugInput = (data: { slug: string }) => data

export const fetchDepartments = createServerFn({ method: 'GET' }).handler(() =>
  getList<DepartmentListItem>('/departments'),
)

export const fetchDepartment = createServerFn({ method: 'GET' })
  .validator(slugInput)
  .handler(({ data }) =>
    get<DepartmentDetail>(`/departments/${encodeURIComponent(data.slug)}`),
  )

export const fetchDoctors = createServerFn({ method: 'GET' }).handler(() =>
  getList<DoctorCardData>('/doctors'),
)

export const fetchDoctor = createServerFn({ method: 'GET' })
  .validator(slugInput)
  .handler(({ data }) =>
    get<DoctorDetail>(`/doctors/${encodeURIComponent(data.slug)}`),
  )

export const fetchTreatments = createServerFn({ method: 'GET' })
  .validator((data: { q?: string; department?: string }) => data)
  .handler(({ data }) =>
    getList<TreatmentItem>('/treatments', {
      q: data.q,
      department: data.department,
    }),
  )

export const fetchTreatment = createServerFn({ method: 'GET' })
  .validator(slugInput)
  .handler(({ data }) =>
    get<TreatmentDetail>(`/treatments/${encodeURIComponent(data.slug)}`),
  )

/** Where a renamed page now lives (null if the old address never existed). */
export const fetchRedirect = createServerFn({ method: 'GET' })
  .validator((data: { type: EntityType; slug: string }) => data)
  .handler(async ({ data }) => {
    const result = await get<{ new_slug: string }>(
      `/redirects/${data.type}/${encodeURIComponent(data.slug)}`,
    )
    return result?.new_slug ?? null
  })

/**
 * Everything the sitemap lists. A plain server-side function (not a server function):
 * only the /sitemap.xml route calls it. Throws when the API cannot be reached, so the
 * route can say "try again later" instead of publishing an empty sitemap.
 */
export async function fetchSitemapEntries(): Promise<SitemapEntries> {
  const entries = await get<SitemapEntries>('/sitemap-entries')
  if (!entries) throw new Error('API /sitemap-entries returned nothing')
  return entries
}
