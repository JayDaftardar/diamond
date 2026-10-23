import { useEffect, useRef } from 'react'
import type { ElementType, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
}

/**
 * One gentle fade/slide as a block scrolls into view (use on section heading blocks only).
 *
 * The server renders the content fully visible, so nothing is hidden without JavaScript.
 * After hydration, blocks already on screen stay put; only blocks below the fold are
 * hidden and then revealed once. Reduced-motion users never see any of it.
 */
export function Reveal({ children, as: Tag = 'div', className }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return
    }
    // Already on screen: leave it alone (no flash of hidden content).
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.dataset.state = 'pending'
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.state = 'shown'
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  )
}
