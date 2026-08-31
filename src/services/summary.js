/**
 * Deterministic, data-driven one-line summaries (no fake text).
 */
export function currentSummary(current, unit) {
  if (!current) return ''
  const parts = []
  if (current.condition?.description) {
    parts.push(capitalize(current.condition.description))
  }
  const diff = current.feelsLike != null && current.temp != null
    ? Math.round(current.feelsLike - current.temp)
    : 0
  if (diff >= 2 && current.temp != null) {
    parts.push(`feels ${diff}°${unit === 'imperial' ? 'F' : 'C'} warmer than the air`)
  } else if (diff <= -2 && current.temp != null) {
    parts.push(`feels ${Math.abs(diff)}° cooler than the air`)
  } else if (current.temp != null) {
    parts.push('temperature feels about right')
  }
  return parts.join(' — ').trim()
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}