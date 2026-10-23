import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ContactForm } from '#/components/ContactForm'
import { MapPinIcon, PhoneIcon } from '#/components/Icon'
import { PhoneLink } from '#/components/ui/PhoneLink'
import { DIRECTIONS_URL, MAP_EMBED_URL, PHONES } from '#/content/config'
import { breadcrumbJsonLd, hospitalJsonLd } from '#/lib/jsonld'
import { m } from '#/lib/i18n'
import { buildHead } from '#/lib/seo'

export const Route = createFileRoute('/_site/contact')({
  head: () =>
    buildHead({
      title: m.contact.title,
      description: m.contact.description,
      path: '/contact',
      jsonLd: [
        hospitalJsonLd(),
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.contact.title, path: '/contact' },
        ]),
      ],
    }),
  component: Contact,
})

function Contact() {
  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={[{ label: m.nav.home, to: '/' }, { label: m.contact.title }]}
        />
        <h1 data-rise="">{m.contact.h1}</h1>
        <p
          className="statement"
          data-rise=""
          style={{ '--i': 1 } as React.CSSProperties}
        >
          {m.contact.intro}
        </p>
      </section>

      <section className="wrap contact-grid" aria-label={m.contact.formTitle}>
        <div
          className="stack"
          style={{ '--stack': 'var(--s-5)' } as React.CSSProperties}
        >
          <h2 data-rise="">{m.contact.formTitle}</h2>
          <div data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
            <ContactForm />
          </div>
        </div>

        <div className="contact-details">
          <div data-rise="" style={{ '--i': 3 } as React.CSSProperties}>
            <h2>{m.contact.phonesTitle}</h2>
            <ul className="plain-list">
              {PHONES.map((phone) => (
                <li key={phone.href}>
                  <PhoneLink phone={phone} className="phone-line">
                    <PhoneIcon />
                    <span className="tel">{phone.display}</span>
                  </PhoneLink>
                </li>
              ))}
            </ul>
          </div>
          <div data-rise="" style={{ '--i': 4 } as React.CSSProperties}>
            <h2>{m.contact.addressTitle}</h2>
            <address>
              {m.address.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
            <p style={{ marginTop: 'var(--s-3)' }}>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPinIcon className="inline-icon" />
                {m.footer.getDirections}
              </a>
            </p>
          </div>
          <div data-rise="" style={{ '--i': 5 } as React.CSSProperties}>
            <h2>{m.contact.timingsTitle}</h2>
            <p>{m.hours.open24}</p>
          </div>
        </div>
      </section>

      <section className="section" aria-label={m.footer.findUs}>
        <div className="wrap" data-settle="">
          <iframe
            className="map-frame"
            src={MAP_EMBED_URL}
            title={m.contact.mapTitle}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  )
}
