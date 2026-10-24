import { Phone } from 'lucide-react'
import { Container } from '#/components/ui/Section'
import { PHONES } from '#/content/config'
import { m } from '#/lib/i18n'

/**
 * Thin red strip above the header on every page: the emergency numbers first, then the
 * hospital's standing facts. Phones show the main number only.
 */
export function UtilityStrip() {
  return (
    <div
      data-ui=""
      className="bg-red-600 text-[0.8125rem] font-semibold text-white"
    >
      <Container className="flex min-h-9 items-center justify-between gap-6 py-1.5">
        <p className="flex min-w-0 items-center gap-2">
          <Phone className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="shrink-0">{m.emergency.stripNumbers}:</span>
          {PHONES.map((phone, index) => (
            <a
              key={phone.href}
              href={phone.href}
              className={
                index === 0
                  ? 'py-1 tabular-nums underline-offset-4 hover:underline'
                  : 'hidden py-1 tabular-nums underline-offset-4 before:mr-2 before:text-white/60 before:content-["/"] hover:underline sm:inline'
              }
            >
              {phone.display}
            </a>
          ))}
        </p>
        <ul className="hidden list-none items-center gap-5 lg:flex">
          {[
            m.emergency.stripAyushman,
            m.emergency.stripCashless,
            m.emergency.stripOpen,
          ].map((item, index) => (
            <li
              key={item}
              className={
                index > 0
                  ? 'flex items-center gap-5 before:size-1 before:rounded-full before:bg-white/60'
                  : undefined
              }
            >
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  )
}
