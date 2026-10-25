import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '#/content/config'
import { fetchSitemapEntries } from '#/lib/api'
import { sitemapXml } from '#/lib/sitemap'

/**
 * /sitemap.xml, built on request from the API's list of public pages, so a new doctor or a
 * hidden treatment is reflected within the hour (the cache time) with no rebuild.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const entries = await fetchSitemapEntries()
          return new Response(sitemapXml(entries, SITE_URL), {
            headers: {
              'content-type': 'application/xml; charset=utf-8',
              'cache-control': 'public, max-age=3600, s-maxage=3600',
            },
          })
        } catch {
          // Better "try again later" than an empty sitemap, which could drop pages from Google.
          return new Response('The sitemap is temporarily unavailable.', {
            status: 503,
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'retry-after': '300',
              'cache-control': 'no-store',
            },
          })
        }
      },
    },
  },
})
