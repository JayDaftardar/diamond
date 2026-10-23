/**
 * Language-independent site constants: numbers, URLs, switches.
 * Anything a visitor READS lives in content/en.ts instead, so Marathi can be added there.
 */

/** Public site address, used for canonical links, Open Graph and the sitemap. */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '')

/** Browser-side API address (contact form and admin panel). */
export const API_PUBLIC_URL: string =
  import.meta.env.VITE_API_PUBLIC_URL ?? 'http://localhost:8000'

export interface PhoneNumber {
  /** As shown to visitors, e.g. 0231-2667044 */
  display: string
  /** Dialable from anywhere in India, e.g. tel:+912312667044 */
  href: string
}

function phone(display: string): PhoneNumber {
  // 0231-2667044 -> +91 231 2667044 (drop the trunk 0, keep digits only)
  const digits = display.replace(/\D/g, '').replace(/^0/, '')
  // A word joiner (U+2060) after the hyphen stops a number breaking across two lines.
  return { display: display.replace('-', '-\u2060'), href: `tel:+91${digits}` }
}

/** The first number is the emergency line shown on every page. */
export const PHONES: readonly PhoneNumber[] = [
  phone('0231-2667044'),
  phone('0231-2667045'),
  phone('0231-2667046'),
]
export const EMERGENCY_PHONE: PhoneNumber = PHONES[0]

/**
 * Google Maps embed address. PLACEHOLDER: replace with the hospital's own embed link
 * (Google Maps > Share > Embed a map > copy the src) via VITE_MAP_EMBED_URL.
 */
export const MAP_EMBED_URL: string =
  import.meta.env.VITE_MAP_EMBED_URL ||
  'https://www.google.com/maps?q=Diamond+Hospital+Ramanmala+Kolhapur&output=embed'

/** Opens turn-by-turn directions in the Maps app. */
export const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=Diamond+Hospital+Ramanmala+Kolhapur'

/**
 * Latitude/longitude for structured data. Left unset on purpose: copy the exact point from
 * Google Maps (right-click the hospital > first line) and fill it in. It is omitted until then.
 */
export const GEO: { latitude: number; longitude: number } | null = null

/**
 * Hospital photographs. null = not supplied yet, so a labelled placeholder shows.
 * Put files in public/images/hospital/ and set the file name here.
 */
export const HOSPITAL_PHOTOS = {
  front: 'front.avif' as string | null,
  interior: 'building.jpeg' as string | null,
}

/** Social/search preview image (file in public/images/). null until a photo is supplied. */
export const OG_IMAGE: string | null = null

/**
 * Insurer logo files, by insurer name exactly as written in content/en.ts. Put each file in
 * public/images/insurers/ and add a line like  'Star Health': 'star-health.svg'.
 * Insurers without an entry show their name as text.
 */
export const INSURER_LOGOS: Record<string, string> = {}
