import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { DoctorGrid } from '#/components/Doctor'
import { PhoneIcon } from '#/components/Icon'
import { PresentationFrame } from '#/components/PresentationFrame'
import { YouTubeEmbed } from '#/components/YouTubeEmbed'
import { EMERGENCY_PHONE } from '#/content/config'
import { fetchTreatment } from '#/lib/api'
import { breadcrumbJsonLd, procedureJsonLd } from '#/lib/jsonld'
import { fmt, m } from '#/lib/i18n'
import { newSlugOrNotFound } from '#/lib/loaders'
import { buildHead } from '#/lib/seo'
import { stripHtml, truncate } from '#/lib/text'

export const Route = createFileRoute('/_site/treatments/$slug')({
  loader: async ({ params }) => {
    const treatment = await fetchTreatment({ data: { slug: params.slug } })
    if (!treatment) {
      const slug = await newSlugOrNotFound('treatment', params.slug)
      throw redirect({
        to: '/treatments/$slug',
        params: { slug },
        statusCode: 301,
      })
    }
    return treatment
  },
  head: ({ loaderData: treatment }) => {
    if (!treatment) return {}
    const text = stripHtml(treatment.description_html)
    return buildHead({
      title: `${fmt(m.treatments.seoTitle, { title: treatment.title })} | ${treatment.department.name}`,
      description: truncate(text),
      path: `/treatments/${treatment.slug}`,
      type: 'article',
      jsonLd: [
        procedureJsonLd({
          slug: treatment.slug,
          title: treatment.title,
          description: truncate(text, 300),
        }),
        breadcrumbJsonLd([
          { name: m.nav.home, path: '/' },
          { name: m.departments.title, path: '/departments' },
          {
            name: treatment.department.name,
            path: `/departments/${treatment.department.slug}`,
          },
          { name: treatment.title, path: `/treatments/${treatment.slug}` },
        ]),
      ],
    })
  },
  component: TreatmentPage,
})

function TreatmentPage() {
  const treatment = Route.useLoaderData()
  const { department } = treatment

  return (
    <>
      <section className="page-head wrap">
        <Breadcrumbs
          items={[
            { label: m.nav.home, to: '/' },
            { label: m.departments.title, to: '/departments' },
            {
              label: department.name,
              to: '/departments/$slug',
              params: { slug: department.slug },
            },
            { label: treatment.title },
          ]}
        />
        <h1 data-rise="">{treatment.title}</h1>
        <p
          className="statement"
          data-rise=""
          style={{ '--i': 1, marginTop: 'var(--s-4)' } as React.CSSProperties}
        >
          <Link to="/departments/$slug" params={{ slug: department.slug }}>
            {department.name}
          </Link>
        </p>
      </section>

      <section className="wrap split" aria-label={treatment.title}>
        {/* Sanitised on the server when the admin saves it. */}
        <div
          className="prose"
          data-rise=""
          dangerouslySetInnerHTML={{ __html: treatment.description_html }}
        />
      </section>

      {treatment.youtube_video_id ? (
        <section className="section wrap split media-block">
          <h2 data-rise="">{m.treatments.video}</h2>
          <div data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
            <YouTubeEmbed
              videoId={treatment.youtube_video_id}
              title={treatment.title}
            />
          </div>
        </section>
      ) : null}

      {treatment.presentation_embed_url ? (
        <section className="section section--field">
          <div className="wrap split media-block">
            <h2 data-rise="">{m.treatments.presentation}</h2>
            <div data-rise="" style={{ '--i': 1 } as React.CSSProperties}>
              <PresentationFrame
                url={treatment.presentation_embed_url}
                title={fmt(m.treatments.presentationTitle, {
                  title: treatment.title,
                })}
              />
            </div>
          </div>
        </section>
      ) : null}

      {treatment.doctors.length > 0 ? (
        <section className="section wrap split">
          <h2 data-rise="">{m.treatments.doctors}</h2>
          <DoctorGrid doctors={treatment.doctors} />
        </section>
      ) : null}

      <section className="section section--field">
        <div className="wrap split">
          <p className="statement">
            {fmt(m.treatments.callToAsk, { number: EMERGENCY_PHONE.display })}
          </p>
          <div className="button-row">
            <a className="btn btn--emergency" href={EMERGENCY_PHONE.href}>
              <PhoneIcon />
              {fmt(m.home.callCta, { number: EMERGENCY_PHONE.display })}
            </a>
            <Link
              to="/departments/$slug"
              params={{ slug: department.slug }}
              className="btn btn--quiet"
            >
              {fmt(m.treatments.backTo, { name: department.name })}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
