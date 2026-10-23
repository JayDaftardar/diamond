import type { CSSProperties } from 'react'
import { m } from '#/lib/i18n'

interface PhotoProps {
  /** File name inside public/images/hospital/, or null until the photo is supplied. */
  file: string | null
  alt: string
  /**
   * CSS aspect ratio, e.g. "4 / 3". Leave out to inherit --ratio from a parent, which lets
   * a wrapper change the crop per screen size. The frame keeps its shape on swap.
   */
  ratio?: string
  /** Above-the-fold photo: load immediately and at high priority. */
  priority?: boolean
  /** Text on the placeholder, saying which photograph belongs here. */
  placeholderLabel?: string
}

/**
 * A hospital photograph in a fixed-shape frame with square corners. Until the real file is
 * supplied it shows a flat, clearly labelled field of the same shape.
 */
export function Photo({
  file,
  alt,
  ratio,
  priority,
  placeholderLabel,
}: PhotoProps) {
  const style = ratio ? ({ '--ratio': ratio } as CSSProperties) : undefined

  if (!file) {
    return (
      <div
        className="photo photo--placeholder"
        style={style}
        role="img"
        aria-label={placeholderLabel ?? m.placeholder.photo}
      >
        <strong>{placeholderLabel ?? m.placeholder.photo}</strong>
        {placeholderLabel ? null : <span>{alt}</span>}
      </div>
    )
  }

  return (
    <figure className="photo" style={style}>
      <img
        src={`/images/hospital/${file}`}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
      />
    </figure>
  )
}
