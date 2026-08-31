/**
 * Centralized environment access.
 * Keys are always read from Vite-managed env vars (VITE_*), never hardcoded.
 */
export const env = Object.freeze({
  openWeatherKey: import.meta.env.VITE_OPENWEATHER_API_KEY ?? '',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN ?? '',
})

export const hasOpenWeatherKey = () => Boolean(env.openWeatherKey)
export const hasMapboxToken = () => Boolean(env.mapboxToken)

export function missingKeyMessage() {
  return 'Missing API key. Copy .env.example to .env.local and set VITE_OPENWEATHER_API_KEY.'
}