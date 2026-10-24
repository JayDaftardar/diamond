import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
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
    <nav aria-label={m.treatments.breadcrumbs} data-rise="">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.9375rem] text-slate-500">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight
                className="size-3.5 shrink-0 text-slate-300"
                aria-hidden="true"
              />
            ) : null}
            {item.to ? (
              // Paths come from our own route table; the cast keeps this helper generic.
              <Link
                to={item.to as '/'}
                params={item.params as never}
                className="underline-offset-4 hover:text-blue-600 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium text-navy-950"
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
