/** Smooth, premium easing (expo-out) for timed transitions. */
export const EASE = [0.16, 1, 0.3, 1]

/** Gentle spring preset — organic feel for positional motion. */
export const SPRING = { type: 'spring', stiffness: 300, damping: 32, mass: 1 }

/** Calmer spring for large/heavy elements. */
export const SOFT_SPRING = { type: 'spring', stiffness: 110, damping: 22, mass: 1 }

export const REVEAL_TRANSITION = (delay = 0) => ({
  opacity: { duration: 0.55, ease: EASE, delay },
  y: { type: 'spring', stiffness: 130, damping: 22, mass: 1, delay },
})

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
}

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: EASE } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: EASE } },
}

export const stagger = (staggerChildren = 0.06, delayChildren = 0.05) => ({
  animate: { transition: { staggerChildren, delayChildren } },
})