import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Phone } from 'lucide-react'
import { DoctorGrid } from '#/components/doctors/DoctorCard'
import { PresentationFrame } from '#/components/PresentationFrame'
import { YouTubeEmbed } from '#/components/YouTubeEmbed'
import { buttonClass } from '#/components/ui/button'
import { Closing } from '#/components/ui/Closing'
import { PageHead } from '#/components/ui/PageHead'
import { RICHTEXT } from '#/components/ui/richtext'
import { Container } from '#/components/ui/Section'
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
    // Without text there is little for a search engine to show: describe the page plainly
    // and keep it out of the index until a description is added.
    const summary =
      text ||
      fmt(m.treatments.metaFallback, {
        title: treatment.title,
        department: treatment.department.name,
        number: EMERGENCY_PHONE.display,
      })
    return buildHead({
      title: `${fmt(m.treatments.seoTitle, { title: treatment.title })} | ${treatment.department.name}`,
      description: truncate(summary),
      noindex: !text,
      path: `/treatments/${treatment.slug}`,
      type: 'article',
      jsonLd: [
        procedureJsonLd({
          slug: treatment.slug,
          title: treatment.title,
          description: truncate(summary, 300),
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

const rise = (i: number) => ({ '--i': i }) as React.CSSProperties

function TreatmentPage() {
  const treatment = Route.useLoaderData()
  const { department } = treatment
  const videos = treatment.youtube_video_ids
  const presentations = treatment.presentation_embed_urls
  const number = EMERGENCY_PHONE.display

  return (
    <>
      <PageHead
        crumbs={[
          { label: m.nav.home, to: '/' },
          { label: m.departments.title, to: '/departments' },
          {
            label: department.name,
            to: '/departments/$slug',
            params: { slug: department.slug },
          },
          { label: treatment.title },
        ]}
        eyebrow={m.treatments.eyebrow}
        title={treatment.title}
        intro={
          <Link
            to="/departments/$slug"
            params={{ slug: department.slug }}
            className="font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
          >
            {department.name}
          </Link>
        }
      />

      <section aria-label={treatment.title} className="py-14 lg:py-20">
        <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          {treatment.description_html ? (
            // Sanitised on the server when the admin saves it.
            <div
              className={RICHTEXT}
              data-rise=""
              dangerouslySetInnerHTML={{ __html: treatment.description_html }}
            />
          ) : (
            <p
              className="max-w-2xl text-lead text-pretty text-slate-700"
              data-rise=""
            >
              {fmt(m.treatments.noDescription, {
                title: treatment.title,
                number,
              })}
            </p>
          )}

          <aside className="rounded-2xl bg-blue-50 p-6 lg:sticky lg:top-28">
            <p className="text-eyebrow font-bold text-blue-600 uppercase">
              {m.treatments.department}
            </p>
            <p className="mt-2 font-heading text-xl font-semibold text-navy-950">
              <Link
                to="/departments/$slug"
                params={{ slug: department.slug }}
                className="transition-colors hover:text-blue-600"
              >
                {department.name}
              </Link>
            </p>
            <p className="mt-5 text-slate-700">
              {fmt(m.treatments.callToAsk, { number })}
            </p>
            <a
              href={EMERGENCY_PHONE.href}
              className={buttonClass('emergency', 'md', 'mt-5 w-full')}
            >
              <Phone aria-hidden="true" />
              <span className="whitespace-nowrap tabular-nums">
                {fmt(m.home.callCta, { number })}
              </span>
            </a>
          </aside>
        </Container>
      </section>

      {videos.length > 0 ? (
        <section
          aria-labelledby="treatment-video"
          className="border-t border-slate-200 py-14 lg:py-20"
        >
          <Container>
            <h2
              id="treatment-video"
              className="mb-8 font-heading text-[1.75rem] font-semibold text-navy-950 sm:text-[2rem]"
              data-rise=""
            >
              {videos.length > 1 ? m.treatments.videos : m.treatments.video}
            </h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {videos.map((videoId, index) => (
                <div key={videoId} data-rise="" style={rise(index % 2)}>
                  <YouTubeEmbed
                    videoId={videoId}
                    title={partTitle(treatment.title, index, videos.length)}
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {presentations.length > 0 ? (
        <section
          aria-labelledby="treatment-slides"
          className="bg-blue-50 py-14 lg:py-20"
        >
          <Container>
            <h2
              id="treatment-slides"
              className="mb-8 font-heading text-[1.75rem] font-semibold text-navy-950 sm:text-[2rem]"
              data-rise=""
            >
              {presentations.length > 1
                ? m.treatments.presentations
                : m.treatments.presentation}
            </h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {presentations.map((url, index) => (
                <div key={url} data-rise="" style={rise(index % 2)}>
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
          </Container>
        </section>
      ) : null}

      {treatment.doctors.length > 0 ? (
        <section
          aria-labelledby="treatment-doctors"
          className="border-t border-slate-200 py-14 lg:py-20"
        >
          <Container>
            <h2
              id="treatment-doctors"
              className="mb-8 font-heading text-[1.75rem] font-semibold text-navy-950 sm:text-[2rem]"
              data-rise=""
            >
              {m.treatments.doctors}
            </h2>
            <DoctorGrid doctors={treatment.doctors} />
          </Container>
        </section>
      ) : null}

      <Closing
        id="treatment-contact"
        title={m.treatments.askTitle}
        body={m.about.ctaBody}
      />
    </>
  )
}
