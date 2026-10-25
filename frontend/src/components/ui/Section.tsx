import { clsx } from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

/** The page's content width, with the side gutters. */
export function Container({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={clsx(
        'mx-auto w-full max-w-[77.5rem] px-4 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Small capitals above a heading. `pill` puts it on a pale-blue tag with a dot. */
export function Eyebrow({
  children,
  pill,
  tone = 'blue',
  icon,
  className,
  style,
  ...rest
}: {
  children: ReactNode
  pill?: boolean
  tone?: 'blue' | 'light'
  icon?: ReactNode
  className?: string
  style?: CSSProperties
  'data-rise'?: string
}) {
  return (
    <p
      className={clsx(
        'text-eyebrow font-bold uppercase',
        tone === 'blue' ? 'text-blue-600' : 'text-white/70',
        pill &&
          'inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3.5 py-1.5 ring-1 ring-blue-600/10 ring-inset',
        className,
      )}
      style={style}
      {...rest}
    >
      {pill ? (
        icon ? (
          <span className="shrink-0 [&_svg]:size-3.5" aria-hidden="true">
            {icon}
          </span>
        ) : (
          <span
            className="size-1.5 shrink-0 rounded-full bg-blue-600"
            aria-hidden="true"
          />
        )
      ) : null}
      <span>{children}</span>
    </p>
  )
}

/** The one word in a heading set in blue italic serif. */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <em className="font-accent text-[1.05em] font-semibold text-blue-600 italic">
      {children}
    </em>
  )
}

/** Section opening: label, heading and intro on the left, an optional action on the right. */
export function SectionHeader({
  id,
  eyebrow,
  title,
  intro,
  action,
  tone = 'dark',
  className,
}: {
  id: string
  eyebrow?: ReactNode
  title: ReactNode
  intro?: ReactNode
  action?: ReactNode
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <Eyebrow tone={tone === 'dark' ? 'blue' : 'light'} data-rise="">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <h2
          id={id}
          className={clsx(
            'mt-3 font-heading text-h2 font-semibold text-balance',
            tone === 'dark' ? 'text-navy-950' : 'text-white',
          )}
          data-rise=""
          style={{ '--i': 1 } as CSSProperties}
        >
          {title}
        </h2>
        {intro ? (
          <p
            className={clsx(
              'mt-4 text-lead text-pretty',
              tone === 'dark' ? 'text-slate-700' : 'text-white/80',
            )}
            data-rise=""
            style={{ '--i': 2 } as CSSProperties}
          >
            {intro}
          </p>
        ) : null}
      </div>
      {action ? (
        <div
          className="shrink-0"
          data-rise=""
          style={{ '--i': 2 } as CSSProperties}
        >
          {action}
        </div>
      ) : null}
    </div>
  )
}
