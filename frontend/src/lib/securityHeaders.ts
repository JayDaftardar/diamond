import { API_PUBLIC_URL, MAP_EMBED_URL } from '#/content/config'

const originOf = (address: string) => new URL(address).origin

/**
 * Where the pages are allowed to load things from. Everything not listed is blocked.
 *
 *  - images: this site, the API (doctor photos) and YouTube's thumbnails
 *  - fetch:  this site and the API (contact form, admin)
 *  - frames: only the video, slides and map hosts the site actually embeds. The slide hosts
 *    match the backend's allow-list of presentation links.
 *  - fonts, scripts, styles: this site (inline scripts and styles are allowed because the
 *    framework and the page's own small scripts are inline; see the note below)
 *
 * Note: `script-src` still allows 'unsafe-inline'. A one-time nonce on every inline script
 * would close that gap, but needs per-request wiring through the framework.
 */
export function contentSecurityPolicy(): string {
  const api = originOf(API_PUBLIC_URL)
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https://i.ytimg.com ${api}`,
    "font-src 'self'",
    `connect-src 'self' ${api}`,
    `frame-src https://www.youtube-nocookie.com https://docs.google.com https://onedrive.live.com https://view.officeapps.live.com ${originOf(MAP_EMBED_URL)}`,
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

/**
 * Headers added to every response the frontend sends.
 *
 * In development the Content-Security-Policy and HSTS are left out: the dev server's own
 * live-reload scripts would trip them and fill the console with warnings.
 */
export function securityHeaders(
  pathname: string,
  production: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }
  if (production) {
    headers['Content-Security-Policy'] = contentSecurityPolicy()
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains'
  }
  // The admin is kept out of search results without listing it in robots.txt.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    headers['X-Robots-Tag'] = 'noindex, nofollow'
  }
  return headers
}
