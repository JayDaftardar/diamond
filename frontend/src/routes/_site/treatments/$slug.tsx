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

/** "Angioplasty, part 2" when there are several, so each player has its own name. */
function partTitle(title: string, index: number, count: number) {
  return count > 1
    ? fmt(m.treatments.partTitle, { title, n: String(index + 1) })
    : title
}

function TreatmentPage() {
  const treatment = Route.useLoaderData()
  const { department } = treatment
  const videos = treatment.youtube_video_ids
  const presentations = treatment.presentation_embed_urls

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

      {videos.length > 0 ? (
        <section className="section wrap split media-block">
          <h2 data-rise="">
            {videos.length > 1 ? m.treatments.videos : m.treatments.video}
          </h2>
          <div className="media-list">
            {videos.map((videoId, index) => (
              <div
                key={videoId}
                data-rise=""
                style={{ '--i': index + 1 } as React.CSSProperties}
              >
                <YouTubeEmbed
                  videoId={videoId}
                  title={partTitle(treatment.title, index, videos.length)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {presentations.length > 0 ? (
        <section className="section section--field">
          <div className="wrap split media-block">
            <h2 data-rise="">
              {presentations.length > 1
                ? m.treatments.presentations
                : m.treatments.presentation}
            </h2>
            <div className="media-list">
              {presentations.map((url, index) => (
                <div
                  key={url}
                  data-rise=""
                  style={{ '--i': index + 1 } as React.CSSProperties}
                >
                  <PresentationFrame
                    url={url}
                    title={fmt(m.treatments.presentationTitle, {
                      title: partTitle(
                        treatment.title,
                        index,
                        presentations.length,
                      ),
                    })}
                  />
                </div>
              ))}
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
