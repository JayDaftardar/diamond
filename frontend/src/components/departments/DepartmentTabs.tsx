import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { m } from '#/lib/i18n'
import type { DepartmentListItem } from '#/lib/types'

const pill =
  'block whitespace-nowrap rounded-full px-4 py-2 text-[0.9375rem] font-semibold text-slate-700 ring-1 ring-slate-200 ring-inset transition-colors hover:bg-blue-50 hover:text-blue-700 data-[status=active]:bg-navy-950 data-[status=active]:text-white data-[status=active]:ring-navy-950'

/**
 * Department filter shown as pills. Every pill is a real link to its own address
 * (/departments/cardiology), so each department can be found and shared on its own.
 * Phones get one row that scrolls sideways, opened on the current department; wider
 * screens wrap onto as many lines as needed so nothing is hidden. The current department
 * is marked with aria-current and the dark pill.
 */
export function DepartmentTabs({
  departments,
}: {
  departments: DepartmentListItem[]
}) {
  const list = useRef<HTMLUListElement>(null)

  // On a phone, bring the current pill into the middle of the row (sideways only).
  useEffect(() => {
    const row = list.current
    const current = row?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!row || !current || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({
      left: current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2,
    })
  }, [])

  return (
    <nav aria-label={m.departments.tabsLabel}>
      <ul
        ref={list}
        className="-mx-4 flex [scrollbar-width:none] list-none gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <li data-rise="">
          <Link
            to="/departments"
            search={{}}
            activeOptions={{ exact: true, includeSearch: false }}
            resetScroll={false}
            className={pill}
          >
            {m.departments.all}
          </Link>
        </li>
        {departments.map((department, index) => (
          <li
            key={department.slug}
            data-rise=""
            style={{ '--i': (index + 1) % 8 } as React.CSSProperties}
          >
            <Link
              to="/departments/$slug"
              params={{ slug: department.slug }}
              resetScroll={false}
              className={pill}
            >
              {department.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
