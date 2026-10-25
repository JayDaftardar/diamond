import { clsx } from 'clsx'
import { ArrowDown } from 'lucide-react'
import { INSURER_LOGOS } from '#/content/config'
import { fmt, m } from '#/lib/i18n'

/**
 * Insurance partners as small tiles. A tile shows the insurer's logo once its file is added
 * to public/images/insurers/ and listed in INSURER_LOGOS (content/config.ts); until then it
 * shows the name on its own. The name is always written under the logo. Logo tiles are white, so
 * a logo with a white background (a JPG, say) sits cleanly on them. `scroll` puts the tiles in a
 * fixed-height panel that scrolls (used on the About page, where the full list is long).
 */
export function InsurerTiles({
  className,
  scroll,
}: {
  className?: string
  /** Show the tiles in a fixed-height panel that scrolls, with a hint above it. */
  scroll?: boolean
}) {
  const grid = (
    <ul
      className={clsx(
        'grid list-none grid-cols-2 gap-2 sm:grid-cols-3',
        className,
      )}
      aria-label={m.insurance.title}
    >
      {m.insurance.partners.map((name) => {
        const logo = INSURER_LOGOS[name]
        return (
          <li
            key={name}
            className={clsx(
              'flex min-h-24 flex-col items-center justify-center gap-2 rounded-md px-2 py-3 text-center',
              logo ? 'bg-white ring-1 ring-slate-200 ring-inset' : 'bg-blue-50',
            )}
          >
            {logo ? (
              <span className="flex h-10 w-full items-center justify-center">
                {/* The name is written below, so the picture itself needs no alt text. */}
                <img
                  src={`/images/insurers/${encodeURIComponent(logo)}`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-h-10 w-auto max-w-[90%] rounded-[3px] object-contain"
                />
              </span>
            ) : null}
            <span
              className={clsx(
                'text-[0.8125rem] leading-tight font-semibold',
                logo ? 'text-slate-700' : 'text-navy-900',
              )}
            >
              {name}
            </span>
          </li>
        )
      })}
    </ul>
  )

  if (!scroll) return grid

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-navy-950">
        <ArrowDown className="size-4 text-blue-600" aria-hidden="true" />
        {fmt(m.about.scrollHint, { count: m.insurance.partners.length })}
      </p>
      {/* A fixed-height panel that scrolls on its own. It can be reached and scrolled with
          the keyboard (Tab, then the arrow keys), and it does not pass its scrolling on to the
          page once it reaches the end. */}
      <div
        role="region"
        aria-label={m.about.scrollRegion}
        tabIndex={0}
        className="max-h-[22.5rem] [scrollbar-width:thin] [scrollbar-color:var(--color-blue-600)_var(--color-blue-50)] overflow-y-auto overscroll-contain rounded-xl pr-2"
      >
        {grid}
      </div>
    </div>
  )
}
