/**
 * OPD timings: read the timing text the hospital types in the admin panel (for example
 * "Monday–Saturday, 12 PM–8 PM") and work out, for the current moment in Kolhapur,
 * whether that doctor's OPD is running now, later today, or on which day next.
 *
 * Anything the parser does not understand returns null, and the page simply shows the
 * text as typed. It never guesses.
 */

/** 0 = Sunday … 6 = Saturday, matching Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface OpdBlock {
  days: Weekday[]
  /** Minutes after midnight, end exclusive. */
  start: number
  end: number
}

export type OpdStatus =
  | { kind: 'open'; until: number }
  | { kind: 'later'; from: number }
  | { kind: 'next'; day: Weekday; from: number }

export interface KolkataMoment {
  day: Weekday
  minutes: number
}

// Lookups can miss (unknown words), so values are typed as possibly undefined.
const DAY_NAMES: Record<string, Weekday | undefined> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
}

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const DASH = '\\s*(?:-|–|—|to)\\s*'
const TIME = '(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.|noon)?'
const TIME_RANGE = new RegExp(`${TIME}${DASH}${TIME}`, 'gi')

function toMinutes(
  hour: string,
  minute: string | undefined,
  meridiem: string | undefined,
): number | null {
  let h = Number(hour)
  const m = minute ? Number(minute) : 0
  if (h > 23 || m > 59) return null
  const mer = (meridiem ?? '').toLowerCase().replace(/\./g, '')
  if (mer === 'noon') return 12 * 60 + m
  if (mer === 'pm' && h < 12) h += 12
  if (mer === 'am' && h === 12) h = 0
  return h * 60 + m
}

function parseDays(text: string): Weekday[] | null {
  const t = text.toLowerCase().trim()
  if (!t || /\b(daily|every\s*day|all\s*days|all\s*week)\b/.test(t))
    return ALL_DAYS
  const range = t.match(new RegExp(`^([a-z]+)\\.?${DASH}([a-z]+)\\.?$`))
  if (range) {
    const from = DAY_NAMES[range[1]]
    const to = DAY_NAMES[range[2]]
    if (from === undefined || to === undefined) return null
    const days: Weekday[] = []
    for (let d = from; ; d = ((d + 1) % 7) as Weekday) {
      days.push(d)
      if (d === to) break
    }
    return days
  }
  // A list such as "Mon, Wed, Fri" or "Tuesday and Thursday"
  const words = t.split(/\s*(?:,|&|\band\b)\s*/).filter(Boolean)
  const days = words.map((w) => DAY_NAMES[w.replace(/\.$/, '')])
  return days.every((d) => d !== undefined) && days.length ? days : null
}

/** Parse timing text; several parts may be separated by ";" (e.g. two sessions). */
export function parseOpd(text: string | null | undefined): OpdBlock[] | null {
  if (!text) return null
  const blocks: OpdBlock[] = []
  for (const part of text.split(';')) {
    const ranges = [...part.matchAll(TIME_RANGE)]
    if (!ranges.length) return null
    const dayText = part.slice(0, ranges[0].index).replace(/[,:\s]+$/, '')
    const days = parseDays(dayText)
    if (!days) return null
    for (const r of ranges) {
      // Optional groups are undefined when they did not match.
      const group = (i: number): string | undefined => r[i]
      // "12–8 PM": a missing meridiem on the start borrows the end's.
      const end = toMinutes(r[4], group(5), group(6))
      let start = toMinutes(r[1], group(2), group(3) ?? group(6))
      if (start === null || end === null) return null
      if (!group(3) && group(6) && start > end) start -= 12 * 60
      if (end <= start) return null
      blocks.push({ days, start, end })
    }
  }
  return blocks.length ? blocks : null
}

/** Current weekday and minutes in Kolhapur (India Standard Time), whatever the device's zone. */
export function kolkataMoment(date: Date): KolkataMoment {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    day: DAY_NAMES[get('weekday').toLowerCase()] ?? 0,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

/** Where the OPD stands at a given moment. Looks up to a week ahead. */
export function opdStatus(blocks: OpdBlock[], now: KolkataMoment): OpdStatus {
  const today = blocks.filter((b) => b.days.includes(now.day))
  const running = today.find(
    (b) => now.minutes >= b.start && now.minutes < b.end,
  )
  if (running) return { kind: 'open', until: running.end }
  const later = today
    .filter((b) => b.start > now.minutes)
    .sort((a, b) => a.start - b.start)
    .at(0)
  if (later) return { kind: 'later', from: later.start }
  for (let offset = 1; offset <= 7; offset++) {
    const day = ((now.day + offset) % 7) as Weekday
    const first = blocks
      .filter((b) => b.days.includes(day))
      .sort((a, b) => a.start - b.start)
      .at(0)
    if (first) return { kind: 'next', day, from: first.start }
  }
  // Unreachable for valid blocks (every block has at least one day).
  return { kind: 'next', day: now.day, from: blocks[0].start }
}

/** 720 -> "12 PM", 630 -> "10:30 AM". */
export function formatMinutes(total: number): string {
  const h24 = Math.floor(total / 60) % 24
  const m = total % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h24 < 12 ? 'AM' : 'PM'}`
}

/** Clock face for the hero: always shows minutes, e.g. "5:07 PM". */
export function formatClock(moment: KolkataMoment): string {
  const h24 = Math.floor(moment.minutes / 60)
  const m = moment.minutes % 60
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}
