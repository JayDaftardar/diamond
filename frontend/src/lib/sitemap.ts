import type { SitemapEntries } from '#/lib/types'

/** Pages that are always there. Their dates are not tracked, so no <lastmod>. */
export const STATIC_PATHS = [
  '/',
  '/about',
  '/doctors',
  '/departments',
  '/contact',
] as const

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

interface Url {
  loc: string
  lastmod?: string
}

function lastmod(value: string): string | undefined {
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? undefined : time.toISOString()
}

/**
 * The sitemap: the fixed pages, then every public department, doctor and treatment the
 * backend lists (hidden items and treatments with no text yet are not in that list), each
 * with the date it last changed.
 */
export function sitemapXml(entries: SitemapEntries, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '')
  const urls: Url[] = [
    ...STATIC_PATHS.map((path) => ({ loc: `${base}${path}` })),
    ...entries.departments.map((e) => ({
      loc: `${base}/departments/${encodeURIComponent(e.slug)}`,
      lastmod: lastmod(e.updated_at),
    })),
    ...entries.doctors.map((e) => ({
      loc: `${base}/doctors/${encodeURIComponent(e.slug)}`,
      lastmod: lastmod(e.updated_at),
    })),
    ...entries.treatments.map((e) => ({
      loc: `${base}/treatments/${encodeURIComponent(e.slug)}`,
      lastmod: lastmod(e.updated_at),
    })),
  ]
  const body = urls
    .map(
      (url) =>
        `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${
          url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''
        }\n  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

/**
 * robots.txt: everything may be crawled and the sitemap is announced. The admin is not
 * listed here on purpose (that would advertise it); its pages say "noindex" themselves.
 */
export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml\n`
}
