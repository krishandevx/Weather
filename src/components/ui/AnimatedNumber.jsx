import { useEffect, useState } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { EASE } from '../../lib/motion'

/**
 * Renders a number that smoothly rolls to new values.
 * Respects prefers-reduced-motion (jumps instantly).
 */
export default function AnimatedNumber({ value, format = (v) => v, duration = 0.6 }) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(value)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    mv.set(value)
    if (reduced || value == null) {
      setDisplay(value)
      return undefined
    }
    const controls = animate(mv, value, { duration, ease: EASE })
    const unsub = mv.on('change', setDisplay)
    return () => {
      controls.stop()
      unsub()
    }
  }, [value, reduced, duration, mv])

  return format(display)
}