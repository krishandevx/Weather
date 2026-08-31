export const OWM_BASE = 'https://api.openweathermap.org'
export const OWM_WEATHER = `${OWM_BASE}/data/2.5/weather`
export const OWM_FORECAST = `${OWM_BASE}/data/2.5/forecast`
export const OWM_AIR_POLLUTION = `${OWM_BASE}/data/2.5/air_pollution`
export const OWM_GEO_DIRECT = `${OWM_BASE}/geo/1.0/direct`
export const OWM_GEO_REVERSE = `${OWM_BASE}/geo/1.0/reverse`

// Default location on first launch (real city, real coordinates — data is fetched live).
export const DEFAULT_LOCATION = Object.freeze({
  name: 'Delhi',
  state: 'Delhi',
  country: 'IN',
  lat: 28.6139,
  lon: 77.209,
})

export const DEFAULT_UNITS = 'metric' // 'metric' | 'imperial'

// Server-state freshness windows (respect OWM free-tier call limits).
export const STALE_TIME = {
  current: 1000 * 60 * 5,
  forecast: 1000 * 60 * 10,
  airQuality: 1000 * 60 * 15,
  geocode: 1000 * 60 * 60,
}

export const REQUEST_TIMEOUT_MS = 12000
export const GEOCODE_LIMIT = 6
export const RECENTS_LIMIT = 6
export const FAVORITES_LIMIT = 12
export const COMPARISON_LIMIT = 4

export const STORAGE_KEYS = {
  theme: 'atmos.theme',
  units: 'atmos.units',
  favorites: 'atmos.favorites',
  recents: 'atmos.recents',
  lastLocation: 'atmos.lastLocation',
}

export const MAX_PARTICLES = 70
export const HOURLY_WINDOW_HOURS = 24