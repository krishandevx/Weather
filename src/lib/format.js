export function toUnitTemp(celsius, unit) {
  return unit === 'imperial' ? celsius * (9 / 5) + 32 : celsius
}

export function formatTemp(celsius, unit, { round = true, sign = false } = {}) {
  if (celsius == null) return '—'
  let v = toUnitTemp(celsius, unit)
  if (round) v = Math.round(v)
  const label = `${v}°`
  if (sign && v > 0) return `+${label}`
  return label
}

/** Wind speed (m/s) → km/h or mph. */
export function formatWind(ms, unit) {
  if (ms == null) return '—'
  if (unit === 'imperial') return `${Math.round(ms * 2.237)} mph`
  return `${Math.round(ms * 3.6)} km/h`
}

export function formatVisibility(meters) {
  if (meters == null) return '—'
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km`
  return `${meters} m`
}

export function formatPressure(hpa) {
  if (hpa == null) return '—'
  return `${Math.round(hpa)} hPa`
}

export function formatPrecip(mm, unit) {
  if (mm == null || mm <= 0) return '0'
  const v = unit === 'imperial' ? mm / 25.4 : mm
  if (v < 10) return v.toFixed(1)
  return `${Math.round(v)} ${unit === 'imperial' ? 'in' : 'mm'}`
}

/**
 * OWM gives a fixed offset (seconds) per location. Shift the epoch by the
 * offset and format in UTC — avoids fragile `UTC+05:30` timeZone identifiers.
 */
function shiftedUTC(unitSeconds, offsetSeconds) {
  return new Date((unitSeconds + (offsetSeconds ?? 0)) * 1000)
}

export function formatTime(unitSeconds, offsetSeconds, opts = {}) {
  if (unitSeconds == null) return '—'
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    ...opts,
  }).format(shiftedUTC(unitSeconds, offsetSeconds))
}

export function formatTimeDate(unitSeconds, offsetSeconds) {
  if (unitSeconds == null) return '—'
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(shiftedUTC(unitSeconds, offsetSeconds))
}

export function hourMinute(unitSeconds, offsetSeconds) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(
    shiftedUTC(unitSeconds, offsetSeconds),
  )
}

export function weekdayLabel(unitSeconds, offsetSeconds) {
  return new Intl.DateTimeFormat('en', { weekday: 'long', timeZone: 'UTC' }).format(
    shiftedUTC(unitSeconds, offsetSeconds),
  )
}

export function relativeMinutes(nowSec, targetSec) {
  return Math.max(0, Math.round((targetSec - nowSec) / 60))
}

export function dayKey(unitSeconds, offsetSeconds) {
  const d = new Date((unitSeconds + offsetSeconds) * 1000)
  return d.toISOString().slice(0, 10)
}