import { Link } from '@tanstack/react-router'
import { m } from '#/lib/i18n'

/**
 * Text wordmark with a simple diamond-and-cross mark, used until the hospital supplies
 * its own logo file. To swap: replace the <svg> below with an <img> of the logo.
 */
export function Logo() {
  return (
    <Link
      to="/"
      className="wordmark"
      aria-label={`${m.site.name}, ${m.nav.home}`}
    >
      <svg
        className="wordmark__mark"
        viewBox="0 0 36 36"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M18 2 34 18 18 34 2 18Z"
          fill="none"
          stroke="var(--c-ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M18 10v16M10 18h16"
          stroke="var(--c-brand)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      <span className="wordmark__text">
        <span className="wordmark__name">{m.site.name}</span>
        <span className="wordmark__place">{m.site.locality}</span>
      </span>
    </Link>
  )
}
