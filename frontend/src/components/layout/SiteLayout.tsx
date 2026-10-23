import type { ReactNode } from 'react'
import { m } from '#/lib/i18n'
import { EmergencyBar } from './EmergencyBar'
import { Entrances } from './Entrances'
import { Footer } from './Footer'
import { Header } from './Header'

/** Public-site chrome: skip link, header, page content, footer, emergency bar. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        {m.skip}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <EmergencyBar />
      <Entrances />
    </>
  )
}
