import { clsx } from 'clsx'

export type ButtonVariant =
  | 'primary' // sapphire: the main action
  | 'emergency' // crimson: calling the emergency line, nothing else
  | 'soft' // pale blue: a second action next to a primary one
  | 'light' // white: on a sapphire or navy ground
  | 'outline-light' // white outline: second action on a dark ground

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-tile hover:bg-blue-700',
  emergency: 'bg-red-600 text-white shadow-tile hover:bg-red-700',
  soft: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/15 ring-inset hover:ring-blue-600/40',
  light: 'bg-white text-navy-950 hover:bg-blue-50',
  'outline-light':
    'text-white ring-1 ring-white/45 ring-inset hover:bg-white/10 hover:ring-white',
}

const SIZES = {
  md: 'min-h-12 px-6 text-[1.0625rem]',
  sm: 'min-h-10 px-4 text-[0.9375rem]',
}

/**
 * Classes for anything that looks like a button: a router Link, an <a> or a <button>.
 * A function rather than a component, so each keeps its own element and typed props.
 * `className` must not set `display` (it would fight `inline-flex`): to hide a button at
 * some sizes, wrap it instead.
 */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: keyof typeof SIZES = 'md',
  className?: string,
) {
  return clsx(
    'group inline-flex items-center justify-center gap-2.5 rounded-lg py-2 text-center leading-snug font-semibold',
    'transition duration-200 ease-smooth active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    '[&_svg]:size-[1.15em] [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

/** A text link with a trailing arrow that nudges on hover ("All departments →"). */
export const arrowLinkClass = clsx(
  'group inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700',
  '[&_svg]:size-[1.1em] [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-1 motion-reduce:hover:[&_svg]:translate-x-0',
)
