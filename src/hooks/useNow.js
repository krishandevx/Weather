import { useEffect, useState } from 'react'

/** Ticking clock, throttled; pauses automatically when the tab is hidden. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer
    const tick = () => setNow(new Date())
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(timer)
      } else {
        tick()
        timer = setInterval(tick, intervalMs)
      }
    }
    timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])

  return now
}