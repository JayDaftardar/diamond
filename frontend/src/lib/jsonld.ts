import { EMERGENCY_PHONE, GEO, PHONES, DIRECTIONS_URL } from '#/content/config'
import { absoluteUrl } from '#/lib/seo'
import { m } from '#/lib/i18n'
import type { DoctorDetail } from '#/lib/types'

/**
 * schema.org structured data. Only facts the hospital has supplied are included:
 * there is deliberately NO rating or review data anywhere.
 */

const HOSPITAL_ID = () => `${absoluteUrl('/')}#hospital`

export function hospitalJsonLd(image?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    '@id': HOSPITAL_ID(),
    name: m.site.name,
    url: absoluteUrl('/'),
    description: m.site.description,
    telephone: EMERGENCY_PHONE.href.replace('tel:', ''),
    ...(image ? { image } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: m.address.street,
      addressLocality: m.address.city,
      addressRegion: m.address.region,
      postalCode: m.address.postalCode,
      addressCountry: 'IN',
    },
    ...(GEO
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: GEO.latitude,
            longitude: GEO.longitude,
          },
        }
      : {}),
    hasMap: DIRECTIONS_URL,
    // Open every day, all day.
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    contactPoint: PHONES.map((phone, index) => ({
      '@type': 'ContactPoint',
      telephone: phone.href.replace('tel:', ''),
      contactType: index === 0 ? 'emergency' : 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English'],
    })),
    parentOrganization: {
      '@type': 'Organization',
      name: 'Kolhapur Super Speciality Medical Centre',
    },
  }
}

export function physicianJsonLd(doctor: DoctorDetail, image: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.name,
    url: absoluteUrl(`/doctors/${doctor.slug}`),
    jobTitle: doctor.designation,
    description: `${doctor.designation}. ${doctor.speciality}.`,
    ...(image ? { image } : {}),
    ...(doctor.expertise.length ? { knowsAbout: doctor.expertise } : {}),
    worksFor: { '@id': HOSPITAL_ID() },
  }
}

export function procedureJsonLd(opts: {
  slug: string
  title: string
  description: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: opts.title,
    url: absoluteUrl(`/treatments/${opts.slug}`),
    description: opts.description,
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
