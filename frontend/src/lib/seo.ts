import { OG_IMAGE, SITE_URL } from '#/content/config'
import { m } from '#/lib/i18n'

export interface SeoInput {
  /** Page title WITHOUT the site suffix, e.g. "Cardiology & CVTS in Kolhapur". */
  title: string
  description: string
  /** Path starting with "/", used for the canonical URL. */
  path: string
  /** Use `title` as-is, without appending the site name (for the home page). */
  fullTitle?: boolean
  /** Open Graph type. */
  type?: 'website' | 'article' | 'profile'
  /**
   * Image path under /public/images, or a full https:// address (doctor photos come from the
   * API). Falls back to the site image if one is configured.
   */
  image?: string | null
  /** Keep search engines out (search results, admin). */
  noindex?: boolean
  /** Structured data objects, rendered as JSON-LD. */
  jsonLd?: object[]
}

/** Absolute URL for a site path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** JSON for a <script> tag: "<" is escaped so content can never close the tag early. */
function safeJson(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * Build the object a route returns from head(): title, description, canonical URL,
 * Open Graph / Twitter tags, robots, and JSON-LD. Used by every page for consistency.
 */
export function buildHead(seo: SeoInput) {
  const fullTitle = seo.fullTitle
    ? seo.title
    : `${seo.title} | ${m.site.titleSuffix}`
  const url = absoluteUrl(seo.path)
  const image = seo.image ?? OG_IMAGE
  const imageUrl = image
    ? /^https?:\/\//.test(image)
      ? image
      : absoluteUrl(`/images/${image}`)
    : null

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: seo.description },
      ...(seo.noindex
        ? [{ name: 'robots', content: 'noindex, nofollow' }]
        : []),
      { property: 'og:site_name', content: m.site.name },
      { property: 'og:type', content: seo.type ?? 'website' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: seo.description },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: 'en_IN' },
      ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
      {
        name: 'twitter:card',
        content: imageUrl ? 'summary_large_image' : 'summary',
      },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: seo.description },
      ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: (seo.jsonLd ?? []).map((data) => ({
      type: 'application/ld+json',
      children: safeJson(data),
    })),
  }
}
