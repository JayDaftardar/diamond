import { clsx } from 'clsx'
import { INSURER_LOGOS } from '#/content/config'
import { m } from '#/lib/i18n'

/**
 * Insurance partners as small tiles. A tile shows the insurer's logo once its file is added
 * to public/images/insurers/ and listed in INSURER_LOGOS (content/config.ts); until then it
 * shows the insurer's name, so the list is complete from day one. Logo tiles are white, so
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
              'grid min-h-12 place-items-center rounded-md px-2 py-2 text-center text-[0.8125rem] leading-tight font-semibold',
              logo
                ? 'bg-white ring-1 ring-slate-200 ring-inset'
                : 'bg-blue-50 text-navy-900',
            )}
          >
            {logo ? (
              <img
                src={`/images/insurers/${logo}`}
                alt={name}
                loading="lazy"
                decoding="async"
                className="max-h-8 w-auto max-w-full object-contain"
              />
            ) : (
              name
            )}
          </li>
        )
      })}
    </ul>
  )
}
