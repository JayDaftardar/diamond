import { clsx } from 'clsx'
import { INSURER_LOGOS } from '#/content/config'
import { m } from '#/lib/i18n'

/**
 * Insurance partners as small tiles. A tile shows the insurer's logo once its file is added
 * to public/images/insurers/ and listed in INSURER_LOGOS (content/config.ts); until then it
 * shows the name on its own. The name is always written under the logo. Logo tiles are white, so
 * a logo with a white background (a JPG, say) sits cleanly on them.
 */
export function InsurerTiles({ className }: { className?: string }) {
  return (
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
}
