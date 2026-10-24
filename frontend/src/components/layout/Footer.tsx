import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { Container } from '#/components/ui/Section'
import { DIRECTIONS_URL, MAP_EMBED_URL, PHONES } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import { Logo } from './Logo'
import { NAV_LINKS } from './nav-links'

const heading =
  'text-eyebrow font-bold tracking-[0.14em] text-white/60 uppercase'

/** Footer on every page: address, phones, timings, quick links and the map. */
export function Footer() {
  return (
    <footer
      data-site-footer=""
      data-ui=""
      className="bg-navy-950 text-white/80 [&_:focus-visible]:outline-white"
    >
      <Container className="grid gap-12 pt-16 pb-12 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_0.75fr_1.5fr] lg:gap-10 lg:pt-20">
        <section aria-label={m.site.name}>
          <Logo tone="light" />
          <p className="mt-5 text-[0.9375rem] text-white/70">
            {m.site.venture}
          </p>
          <address className="mt-4 leading-relaxed not-italic">
            {m.address.lines.slice(1).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 font-semibold text-white hover:underline"
          >
            {m.footer.getDirections}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </section>

        <section aria-labelledby="footer-call">
          <h2 id="footer-call" className={heading}>
            {m.footer.call}
          </h2>
          <ul className="mt-4 grid list-none gap-2">
            {PHONES.map((phone) => (
              <li key={phone.href}>
                <a
                  href={phone.href}
                  className="font-heading text-lg font-semibold text-white tabular-nums hover:text-blue-50 hover:underline"
                >
                  {phone.display}
                </a>
              </li>
            ))}
          </ul>
          <h2 className={`${heading} mt-8`}>{m.footer.timings}</h2>
          <p className="mt-3 text-white">{m.hours.open24}</p>
        </section>

        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className={heading}>
            {m.footer.quickLinks}
          </h2>
          <ul className="mt-4 grid list-none gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="footer-map">
          <h2 id="footer-map" className={heading}>
            {m.footer.findUs}
          </h2>
          <iframe
            className="mt-4 aspect-[16/10] w-full rounded-xl border-0 bg-navy-900"
            src={MAP_EMBED_URL}
            title={m.footer.mapTitle}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </Container>

      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/60">
          <p>{fmt(m.footer.copyright, { year: new Date().getFullYear() })}</p>
          <a
            href="#main"
            className="inline-block py-2 hover:text-white hover:underline"
          >
            {m.footer.backToTop}
          </a>
        </div>
      </Container>
    </footer>
  )
}
