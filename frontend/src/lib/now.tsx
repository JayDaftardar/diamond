import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * "Now", shared by the hero clock and every OPD status on the page.
 *
 * The first value comes from the route loader, so the server-rendered HTML and the first
 * browser render agree exactly (no hydration mismatch). After that the browser takes over
 * and ticks on each new minute.
 */
const NowContext = createContext<number | null>(null)

export function NowProvider({
  initial,
  children,
}: {
  initial: number
  children: ReactNode
}) {
  const [now, setNow] = useState(initial)

  useEffect(() => {
    setNow(Date.now())
    let interval: ReturnType<typeof setInterval> | undefined
    // Align to the start of the next minute, then tick once a minute.
    const timeout = setTimeout(
      () => {
        setNow(Date.now())
        interval = setInterval(() => setNow(Date.now()), 60_000)
      },
      60_000 - (Date.now() % 60_000),
    )
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>
}

/** Milliseconds since epoch, or null outside a NowProvider (e.g. the 404 page). */
export function useNow(): number | null {
  return useContext(NowContext)
}
