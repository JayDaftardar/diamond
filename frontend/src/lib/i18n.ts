import { en } from '#/content/en'
import type { Messages } from '#/content/en'

/**
 * The active message set. English only for now; to add Marathi, create content/mr.ts
 * (typed as Messages) and pick it here from the current locale.
 */
export const m: Messages = en

/** Fill {placeholders} in a message: fmt(m.emergency.callNumber, { number: '0231-2667044' }) */
export function fmt(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  )
}
