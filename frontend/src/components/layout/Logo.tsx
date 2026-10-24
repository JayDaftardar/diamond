import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { m } from '#/lib/i18n'

/**
 * Text wordmark with a simple diamond-and-cross mark, used until the hospital supplies
 * its own logo file. To swap: replace the <svg> below with an <img> of the logo.
 * `tone="light"` is for dark grounds (the footer).
 */
export function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3"
      aria-label={`${m.site.name}, ${m.nav.home}`}
    >
      <svg
        className="size-9 shrink-0 transition-transform duration-500 ease-smooth group-hover:rotate-45 motion-reduce:transition-none sm:size-10"
        viewBox="0 0 36 36"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M18 2 34 18 18 34 2 18Z"
          fill="none"
          stroke={tone === 'dark' ? 'var(--color-navy-950)' : '#fff'}
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        <path
          d="M18 11v14M11 18h14"
          stroke="var(--color-blue-600)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col">
        <span
          className={clsx(
            'font-heading text-[1.125rem] leading-tight font-bold whitespace-nowrap sm:text-[1.3125rem]',
            tone === 'dark' ? 'text-navy-950' : 'text-white',
          )}
        >
          {m.site.name}
        </span>
        <span
          className={clsx(
            'text-[0.625rem] leading-tight font-bold tracking-[0.14em] whitespace-nowrap uppercase sm:text-[0.6875rem]',
            tone === 'dark' ? 'text-blue-600' : 'text-white/70',
          )}
        >
          {m.site.locality}
        </span>
      </span>
    </Link>
  )
}
