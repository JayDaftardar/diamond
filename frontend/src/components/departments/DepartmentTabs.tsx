import { Link } from '@tanstack/react-router'
import { m } from '#/lib/i18n'
import type { DepartmentListItem } from '#/lib/types'

/**
 * Department filter shown as tabs. Every tab is a real link to its own address
 * (/departments/cardiology), so each department view can be found and shared on its own.
 * The tabs wrap onto as many lines as they need, so no department is hidden off-screen.
 * The current one is marked with aria-current and the dark field.
 */
export function DepartmentTabs({
  departments,
}: {
  departments: DepartmentListItem[]
}) {
  return (
    <nav className="dept-tabs" aria-label={m.departments.tabsLabel}>
      <div className="dept-tabs__list">
        <ul>
          <li data-rise="">
            <Link
              to="/departments"
              search={{}}
              activeOptions={{ exact: true, includeSearch: false }}
              resetScroll={false}
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
              >
                {department.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
