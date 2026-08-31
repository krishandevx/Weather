/**
 * OpenWeatherMap air-quality index (1–5) → category, color, guidance.
 */
export const AQI_LEVELS = [
  {
    max: 1,
    label: 'Good',
    color: '#22c55e',
    note: 'Air quality is good — enjoy the outdoors.',
  },
  {
    max: 2,
    label: 'Fair',
    color: '#a3e635',
    note: 'Acceptable air quality for most people.',
  },
  {
    max: 3,
    label: 'Moderate',
    color: '#facc15',
    note: 'Sensitive groups should limit prolonged outdoor exertion.',
  },
  {
    max: 4,
    label: 'Poor',
    color: '#fb923c',
    note: 'Reduce prolonged or heavy outdoor exertion.',
  },
  {
    max: 5,
    label: 'Very Poor',
    color: '#f87171',
    note: 'Avoid outdoor activity; keep windows closed.',
  },
]

export function aqiLevel(aqi) {
  if (aqi == null) return null
  for (const level of AQI_LEVELS) {
    if (aqi <= level.max) return level
  }
  return AQI_LEVELS[AQI_LEVELS.length - 1]
}