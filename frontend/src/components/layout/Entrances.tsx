import { useEffect } from 'react'

declare global {
  interface Window {
    __entrances?: boolean
  }
}

/**
 * Runs the section entrances: any element marked data-rise or data-settle gets the class
 * "is-in" once it scrolls into view (CSS in ui.css does the moving). Re-scans whenever the
 * page content changes. The hidden starting state only applies under html.js, and an inline script
 * in __root removes that class if this never runs, so content can't stay invisible.
 */
export function Entrances() {
  useEffect(() => {
    window.__entrances = true
    const selector = '[data-rise]:not(.is-in), [data-settle]:not(.is-in)'

    if (!('IntersectionObserver' in window)) {
      document
        .querySelectorAll<HTMLElement>(selector)
        .forEach((el) => el.classList.add('is-in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    // observe() on an element already being observed is a no-op, so rescanning is cheap.
    const scan = () =>
      document
        .querySelectorAll<HTMLElement>(selector)
        .forEach((el) => observer.observe(el))
    scan()

    // Rescan whenever the page content changes. Watching the DOM, rather than the URL,
    // catches the new page however late the router renders it.
    let frame = 0
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(scan)
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(frame)
      mutations.disconnect()
      observer.disconnect()
    }
  }, [])

  return null
}
