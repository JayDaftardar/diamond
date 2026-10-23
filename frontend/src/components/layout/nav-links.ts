import { m } from '#/lib/i18n'

/** Public navigation, shared by the header, mobile menu and footer. */
export const NAV_LINKS = [
  { to: '/', label: m.nav.home, exact: true },
  { to: '/about', label: m.nav.about, exact: false },
  { to: '/doctors', label: m.nav.doctors, exact: false },
  { to: '/departments', label: m.nav.departments, exact: false },
  { to: '/contact', label: m.nav.contact, exact: false },
] as const
