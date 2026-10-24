import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import muktaRegular from '@fontsource/mukta/files/mukta-latin-400-normal.woff2?url'
import domineSemibold from '@fontsource/domine/files/domine-latin-600-normal.woff2?url'
import accentItalic from '@fontsource/source-serif-4/files/source-serif-4-latin-600-italic.woff2?url'
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
      // Preload the fonts of the hero (body text, heading, accent word) so text doesn't jump
      // when they arrive.
      // Production only: the dev server re-adds these links after hydration, fetching
      // the fonts a second time and logging an "unused preload" warning.
      ...(import.meta.env.PROD
        ? [muktaRegular, domineSemibold, accentItalic].map((href) => ({
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

/**
 * Reveals what is already on screen the moment the page's HTML has arrived, without waiting
 * for the app's JavaScript (which can take seconds on a slow phone). Everything below the
 * fold still waits for Entrances.tsx and appears as it scrolls into view.
 *
 * It uses the Web Animations API, not a class: an animation changes no attribute, so React
 * sees nothing to complain about when it hydrates. Same movement as the CSS in index.css.
 */
const REVEAL_VISIBLE = `(function(){var d=document.documentElement;if(!d.classList.contains('js')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;var h=innerHeight*0.92,e='cubic-bezier(.22,1,.36,1)',a=document.querySelectorAll('[data-rise]'),i,r;for(i=0;i<a.length;i++){if(a[i].getBoundingClientRect().top<h){r=parseFloat(getComputedStyle(a[i]).getPropertyValue('--i'))||0;a[i].animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:700,delay:r*80,easing:e,fill:'both'})}}a=document.querySelectorAll('[data-settle]');for(i=0;i<a.length;i++){r=a[i].firstElementChild;if(r&&a[i].getBoundingClientRect().top<h)r.animate([{transform:'scale(1.06)'},{transform:'none'}],{duration:1400,easing:e,fill:'both'})}})()`

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
        <script dangerouslySetInnerHTML={{ __html: REVEAL_VISIBLE }} />
        <Scripts />
      </body>
    </html>
  )
}
