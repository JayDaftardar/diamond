import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import muktaRegular from '@fontsource/mukta/files/mukta-latin-400-normal.woff2?url'
import martelBold from '@fontsource/martel/files/martel-latin-800-normal.woff2?url'
import appCss from '../styles/index.css?url'
import { ErrorPage } from '#/components/ErrorPage'
import { NotFound } from '#/components/NotFound'
import { m } from '#/lib/i18n'

/**
 * The bare HTML document. Public chrome (header, footer, emergency bar) lives in the
 * pathless `_site` layout, so the admin area can render without it.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#1E3A8A' },
      { title: m.site.nameFull },
      { name: 'description', content: m.site.description },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      // Preload the two fonts used above the fold so text doesn't jump when they arrive.
      // Production only: the dev server re-adds these links after hydration, fetching
      // the fonts a second time and logging an "unused preload" warning.
      ...(import.meta.env.PROD
        ? [muktaRegular, martelBold].map((href) => ({
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            href,
            crossOrigin: 'anonymous' as const,
          }))
        : []),
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
})

/**
 * Marks the page as scripted before first paint, so entrance animations can start hidden.
 * If the app never starts (script blocked or failed), the mark is removed after 4 seconds
 * and everything shows normally.
 */
const JS_FLAG = `document.documentElement.classList.add('js');setTimeout(function(){if(!window.__entrances)document.documentElement.classList.remove('js')},4000)`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // The inline JS_FLAG script adds the `js` class before hydration, so the class
    // differs from the server HTML on purpose.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
