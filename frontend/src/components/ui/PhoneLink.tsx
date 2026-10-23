import type { ReactNode } from 'react'
import type { PhoneNumber } from '#/content/config'

interface PhoneLinkProps {
  phone: PhoneNumber
  className?: string
  /** Replace the visible number (the dialled number stays the same). */
  children?: ReactNode
}

/** A tap-to-call link. Digits use tabular figures so lists of numbers line up. */
export function PhoneLink({ phone, className, children }: PhoneLinkProps) {
  return (
    <a href={phone.href} className={className}>
      {children ?? <span className="tel">{phone.display}</span>}
    </a>
  )
}
