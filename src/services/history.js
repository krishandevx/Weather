/**
 * Historical weather is not available on OpenWeatherMap's free tier.
 * Connect a History-plan provider here and return real series:
 *   { days: [ { key, max, min, rainTotal, avgHumidity } ] }
 */
export const HISTORY_UNAVAILABLE = true
export const HISTORY_REASON = 'Requires the OpenWeatherMap History (paid) tier.'