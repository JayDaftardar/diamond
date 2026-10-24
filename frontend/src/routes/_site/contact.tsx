import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, Clock, MapPin, Phone } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { ContactForm } from '#/components/ContactForm'
import { PageHead } from '#/components/ui/PageHead'
import { Container } from '#/components/ui/Section'
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

const rise = (i: number) => ({ '--i': i }) as CSSProperties

function Contact() {
  return (
    <>
      <PageHead
        crumbs={[{ label: m.nav.home, to: '/' }, { label: m.contact.title }]}
        eyebrow={m.contact.eyebrow}
        title={m.contact.h1}
        intro={m.contact.intro}
      />

      <section aria-label={m.contact.formTitle} className="py-14 lg:py-20">
        <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          {/* Ways to reach the hospital */}
          <div className="grid gap-4">
            <Tile
              icon={<Phone />}
              title={m.contact.emergencyTitle}
              i={0}
              emergency
            >
              <p className="text-slate-700">{m.contact.emergencyText}</p>
              <ul className="mt-3 grid list-none gap-1.5">
                {PHONES.map((phone) => (
                  <li key={phone.href}>
                    <a
                      href={phone.href}
                      className="font-heading text-[1.375rem] font-semibold text-navy-950 tabular-nums transition-colors hover:text-red-600"
                    >
                      {phone.display}
                    </a>
                  </li>
                ))}
              </ul>
            </Tile>

            <Tile icon={<MapPin />} title={m.contact.addressTitle} i={1}>
              <address className="text-slate-700 not-italic">
                {m.address.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {m.footer.getDirections}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </Tile>

            <Tile icon={<Clock />} title={m.contact.timingsTitle} i={2}>
              <p className="text-slate-700">{m.hours.open24}</p>
            </Tile>
          </div>

          {/* The message form */}
          <div
            className="rounded-3xl bg-blue-50 p-6 sm:p-10"
            data-rise=""
            style={rise(1)}
          >
            <h2 className="font-heading text-[1.75rem] leading-tight font-semibold text-navy-950 sm:text-[2rem]">
              {m.contact.formTitle}
            </h2>
            <p className="mt-3 mb-8 text-slate-700">{m.contact.formIntro}</p>
            <ContactForm />
          </div>
        </Container>
      </section>

      <section aria-label={m.footer.findUs} className="pb-20 lg:pb-28">
        <Container>
          <div
            className="overflow-hidden rounded-3xl shadow-card ring-1 ring-slate-200"
            data-settle=""
          >
            <iframe
              className="block aspect-[4/3] w-full border-0 sm:aspect-[16/7]"
              src={MAP_EMBED_URL}
              title={m.contact.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Container>
      </section>
    </>
  )
}

/** One way to reach the hospital: an icon, a title and the details. */
function Tile({
  icon,
  title,
  children,
  i,
  emergency,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  i: number
  emergency?: boolean
}) {
  return (
    <div
      className="flex gap-5 rounded-2xl bg-white p-6 shadow-tile ring-1 ring-slate-200/70"
      data-rise=""
      style={rise(i)}
    >
      <span
        className={
          emergency
            ? 'grid size-12 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 [&_svg]:size-6'
            : 'grid size-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 [&_svg]:size-6'
        }
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <h2 className="mb-2 text-eyebrow font-bold text-navy-950 uppercase">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
