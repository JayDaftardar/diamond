import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '#/content/config'
import { robotsTxt } from '#/lib/sitemap'

/** /robots.txt: crawling is allowed and the sitemap is announced. */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(robotsTxt(SITE_URL), {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600, s-maxage=3600',
          },
        }),
    },
  },
})
