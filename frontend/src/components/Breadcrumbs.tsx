import { Link } from '@tanstack/react-router'
import { m } from '#/lib/i18n'

export interface Crumb {
  label: string
  /** Omit for the current page. */
  to?: string
  params?: Record<string, string>
}

/** Breadcrumb trail. The last item is the current page and is not a link. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      className="breadcrumbs"
      aria-label={m.treatments.breadcrumbs}
      data-rise=""
    >
      <ol>
        {items.map((item, index) => (
          <li key={item.label}>
            {item.to ? (
              // Paths come from our own route table; the cast keeps this helper generic.
              <Link to={item.to as '/'} params={item.params as never}>
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
