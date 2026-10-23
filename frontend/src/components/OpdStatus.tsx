import { fmt, m } from '#/lib/i18n'
import { useNow } from '#/lib/now'
import { formatMinutes, kolkataMoment, opdStatus, parseOpd } from '#/lib/opd'
import type { OpdStatus as Status } from '#/lib/opd'

/** The OPD status for some timing text right now, or null if it can't be worked out. */
export function useOpdStatus(timings: string | null): Status | null {
  const now = useNow()
  const blocks = parseOpd(timings)
  if (now === null || !blocks) return null
  return opdStatus(blocks, kolkataMoment(new Date(now)))
}

export function describeStatus(status: Status): string {
  const time = formatMinutes(
    status.kind === 'open' ? status.until : status.from,
  )
  if (status.kind === 'open') return fmt(m.opd.open, { time })
  if (status.kind === 'later') return fmt(m.opd.later, { time })
  return fmt(m.opd.next, { day: m.opd.days[status.day], time })
}

/**
 * One line such as "In OPD now, until 8 PM". Renders nothing when the timing text can't be
 * read, so the typed timings (always shown next to it) are never contradicted.
 */
export function OpdStatusLine({
  timings,
  className,
}: {
  timings: string | null
  className?: string
}) {
  const status = useOpdStatus(timings)
  if (!status) return null
  return (
    <span className={className} data-open={status.kind === 'open' || undefined}>
      {describeStatus(status)}
    </span>
  )
}
