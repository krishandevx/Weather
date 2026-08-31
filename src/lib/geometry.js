export const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** Bearing degrees → cardinal compass point ("SSW"). */
export function windDirection(deg) {
  if (deg == null) return { cardinal: '—', deg: null }
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8
  return { cardinal: CARDINALS[index], deg }
}

/**
 * Deterministic UV estimate (0–11) from solar elevation + cloud attenuation.
 * Labeled "estimated" in the UI; replace with a real UV provider in this module.
 */
export function estimateUvIndex({ nowSec, sun, cloudCover }) {
  if (!sun?.sunrise || !sun?.sunset) return null
  const daylightMinutes = (sun.sunset - sun.sunrise) / 60
  if (!daylightMinutes || daylightMinutes <= 0) return null
  const elapsed = (nowSec - sun.sunrise) / 60
  if (elapsed < 0 || elapsed > daylightMinutes) return 0 // night-time
  const fraction = Math.min(1, elapsed / daylightMinutes)
  const elevation = 90 * Math.sin(Math.PI * fraction) // ~degrees above horizon
  const attenuation = 1 - clamp((cloudCover ?? 0) / 100, 0, 1) * 0.7
  const index = clamp((elevation / 90) * 11 * attenuation, 0, 11)
  return { index: Math.round(index * 100) / 100 }
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}