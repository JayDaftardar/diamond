import type { ReactNode } from 'react'
import { m } from '#/lib/i18n'
import { EmergencyBar } from './EmergencyBar'
import { Entrances } from './Entrances'
import { Footer } from './Footer'
import { Header } from './Header'
import { UtilityStrip } from './UtilityStrip'

/** Public-site chrome: skip link, red strip, header, page content, footer, emergency bar. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        className="absolute top-2 left-4 z-[100] -translate-y-[200%] rounded-lg bg-navy-950 px-4 py-3 font-semibold text-white focus:translate-y-0"
        href="#main"
      >
        {m.skip}
      </a>
      <UtilityStrip />
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer />
      <EmergencyBar />
      <Entrances />
    </>
  )
}
