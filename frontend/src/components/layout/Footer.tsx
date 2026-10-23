import { Link } from '@tanstack/react-router'
import { DIRECTIONS_URL, MAP_EMBED_URL, PHONES } from '#/content/config'
import { fmt, m } from '#/lib/i18n'
import { PhoneLink } from '#/components/ui/PhoneLink'
import { NAV_LINKS } from './nav-links'

/** Footer on every page: address, phones, timings, quick links and the map. */
export function Footer() {
  return (
    <footer className="site-footer on-ink">
      <div className="wrap site-footer__grid">
        <section aria-labelledby="footer-name">
          <h2 id="footer-name" className="site-footer__name">
            {m.site.name}
          </h2>
          <p className="site-footer__muted">{m.site.venture}</p>
          <address>
            {m.address.lines.slice(1).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
          <p>
            <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
              {m.footer.getDirections}
            </a>
          </p>
        </section>

        <section aria-labelledby="footer-call">
          <h3 id="footer-call">{m.footer.call}</h3>
          <ul className="site-footer__list">
            {PHONES.map((phone) => (
              <li key={phone.href}>
                <PhoneLink phone={phone} />
              </li>
            ))}
          </ul>
          <h3>{m.footer.timings}</h3>
          <p>{m.hours.open24}</p>
        </section>

        <nav aria-labelledby="footer-links">
          <h3 id="footer-links">{m.footer.quickLinks}</h3>
          <ul className="site-footer__list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="footer-map">
          <h3 id="footer-map">{m.footer.findUs}</h3>
          <iframe
            className="site-footer__map"
            src={MAP_EMBED_URL}
            title={m.footer.mapTitle}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </div>

      <div className="wrap site-footer__base">
        <p>{fmt(m.footer.copyright, { year: new Date().getFullYear() })}</p>
        <p>
          <a href="#main">{m.footer.backToTop}</a>
        </p>
      </div>
    </footer>
  )
}
