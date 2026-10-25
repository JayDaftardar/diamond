import { createMiddleware, createStart } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { securityHeaders } from '#/lib/securityHeaders'

/** Adds the security headers to every response (pages, server functions, sitemap). */
const addSecurityHeaders = createMiddleware({ type: 'request' }).server(
  ({ next, request }) => {
    const { pathname } = new URL(request.url)
    const headers = securityHeaders(pathname, import.meta.env.PROD)
    for (const [name, value] of Object.entries(headers)) {
      setResponseHeader(name, value)
    }
    return next()
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [addSecurityHeaders],
}))
