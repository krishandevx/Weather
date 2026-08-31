import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getCurrentWeather, getForecast, getAirQuality, searchCities } from '../api/weatherApi'
import { normalizeCurrent, normalizeForecast, normalizeAirQuality } from '../services/normalize'
import { STALE_TIME } from '../config/constants'
import { hasOpenWeatherKey } from '../config/env'
import { isApiError } from '../api/httpClient'

function retryPolicy(failureCount, error) {
  if (isApiError(error, 'RATE_LIMIT')) return failureCount < 2
  if (isApiError(error, 'NETWORK')) return failureCount < 1
  return false
}

function coordsOf(location) {
  return location ? { lat: location.lat, lon: location.lon } : null
}

export function useWeather(location) {
  const coords = coordsOf(location)
  const enabled = Boolean(coords) && hasOpenWeatherKey()

  const currentQuery = useQuery({
    queryKey: ['weather', 'current', coords],
    queryFn: () => getCurrentWeather(coords),
    enabled,
    staleTime: STALE_TIME.current,
    retry: retryPolicy,
    placeholderData: keepPreviousData,
  })

  const forecastQuery = useQuery({
    queryKey: ['weather', 'forecast', coords],
    queryFn: () => getForecast(coords),
    enabled,
    staleTime: STALE_TIME.forecast,
    retry: retryPolicy,
    placeholderData: keepPreviousData,
  })

  const current = currentQuery.data ? normalizeCurrent(currentQuery.data, location) : null
  const forecast = forecastQuery.data ? normalizeForecast(forecastQuery.data) : null

  return {
    location,
    current,
    hourly: forecast?.hourly ?? [],
    daily: forecast?.daily ?? [],
    series: forecast?.series ?? [],
    sun: forecast?.sun ?? null,
    timezoneOffset: forecast?.timezoneOffset ?? current?.timezoneOffset ?? 0,
    error: currentQuery.error ?? forecastQuery.error ?? null,
    isLoading: currentQuery.isLoading || forecastQuery.isLoading,
    isFetching: currentQuery.isFetching || forecastQuery.isFetching,
    isRefetching: currentQuery.isRefetching || forecastQuery.isRefetching,
    refetch: () => {
      currentQuery.refetch()
      forecastQuery.refetch()
    },
  }
}

export function useAirQuality(location) {
  const coords = coordsOf(location)
  const enabled = Boolean(coords) && hasOpenWeatherKey()
  const query = useQuery({
    queryKey: ['air', 'quality', coords],
    queryFn: () => getAirQuality(coords),
    enabled,
    staleTime: STALE_TIME.airQuality,
    retry: retryPolicy,
    placeholderData: keepPreviousData,
  })
  return {
    air: query.data ? normalizeAirQuality(query.data) : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCitySearch(query) {
  const q = (query ?? '').trim()
  return useQuery({
    queryKey: ['geo', 'search', q],
    queryFn: () => searchCities(q),
    enabled: q.length >= 2 && hasOpenWeatherKey(),
    staleTime: STALE_TIME.geocode,
    retry: false,
  })
}