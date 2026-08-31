import { fetchJson } from './httpClient'
import { env } from '../config/env'
import {
  OWM_WEATHER,
  OWM_FORECAST,
  OWM_AIR_POLLUTION,
  OWM_GEO_DIRECT,
  OWM_GEO_REVERSE,
  GEOCODE_LIMIT,
} from '../config/constants'

function withKey() {
  if (!env.openWeatherKey) return null
  return `appid=${env.openWeatherKey}`
}

function coordParams({ lat, lon, units }) {
  const p = new URLSearchParams({ lat: String(lat), lon: String(lon), units: units ?? 'metric' })
  const key = withKey()
  if (key) p.set('appid', env.openWeatherKey)
  return p
}

function searchParams(qs) {
  const p = new URLSearchParams(qs)
  const key = withKey()
  if (key) p.set('appid', env.openWeatherKey)
  return p
}

export async function getCurrentWeather({ lat, lon, signal }) {
  const url = `${OWM_WEATHER}?${coordParams({ lat, lon })}`
  return fetchJson(url, { signal })
}

export async function getForecast({ lat, lon, signal }) {
  const url = `${OWM_FORECAST}?${coordParams({ lat, lon })}`
  return fetchJson(url, { signal })
}

export async function getAirQuality({ lat, lon, signal }) {
  const url = `${OWM_AIR_POLLUTION}?${coordParams({ lat, lon })}`
  return fetchJson(url, { signal })
}

export async function searchCities(query, { signal } = {}) {
  const url = `${OWM_GEO_DIRECT}?${searchParams({ q: query, limit: GEOCODE_LIMIT })}`
  const list = await fetchJson(url, { signal })
  return Array.isArray(list) ? list : []
}

export async function reverseGeocode({ lat, lon }, { signal } = {}) {
  const url = `${OWM_GEO_REVERSE}?${searchParams({ lat: String(lat), lon: String(lon), limit: 1 })}`
  const list = await fetchJson(url, { signal })
  const hit = Array.isArray(list) ? list[0] : undefined
  return hit?.name ? hit : null
}