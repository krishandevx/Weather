import { HOURLY_WINDOW_HOURS } from '../config/constants'

function firstDefined(...values) {
  for (const v of values) if (v != null) return v
  return null
}

/**
 * Local wall-clock helpers for OWM epoch seconds + timezone offset.
 */
export function localIsoDay(dtSeconds, offsetSeconds) {
  return new Date((dtSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10)
}

export function localIsoTime(dtSeconds, offsetSeconds) {
  return new Date((dtSeconds + offsetSeconds) * 1000).toISOString().slice(11, 19)
}

function toCondition(entry) {
  const c = entry ?? {}
  return {
    id: c.id ?? null,
    main: c.main ?? null,
    description: c.description ?? null,
    icon: c.icon ?? null,
  }
}

function isDaytime(dtSeconds, sun) {
  if (!sun?.sunrise || !sun?.sunset) return true
  return dtSeconds >= sun.sunrise && dtSeconds < sun.sunset
}

export function normalizeCurrent(raw, place) {
  const main = raw.main ?? {}
  const wind = raw.wind ?? {}
  const sun = raw.sys ?? {}
  const cond = raw.weather?.[0]
  return {
    id: raw.id ?? null,
    dt: raw.dt ?? null,
    timezoneOffset: raw.timezone ?? 0,
    coord: raw.coord ?? null,
    placeName: place?.name ?? raw.name ?? 'Unknown',
    state: place?.state ?? null,
    country: place?.country ?? sun.country ?? '',
    condition: cond ? toCondition(cond) : null,
    temp: main.temp ?? null,
    feelsLike: main.feels_like ?? null,
    tempMin: main.temp_min ?? null,
    tempMax: main.temp_max ?? null,
    humidity: main.humidity ?? null,
    pressure: main.pressure ?? null,
    visibility: raw.visibility ?? null,
    cloudCover: raw.clouds?.all ?? null,
    wind: {
      speed: wind.speed ?? null,
      deg: wind.deg ?? null,
      gust: wind.gust ?? null,
    },
    rain1h: firstDefined(raw.rain?.['1h'], raw.rain),
    snow1h: firstDefined(raw.snow?.['1h'], raw.snow),
    sun: {
      sunrise: sun.sunrise ?? null,
      sunset: sun.sunset ?? null,
    },
    isDay: isDaytime(raw.dt, { sunrise: sun.sunrise, sunset: sun.sunset }),
  }
}

export function normalizeForecast(raw) {
  const offset = raw.city?.timezone ?? 0
  const sun = { sunrise: raw.city?.sunrise ?? null, sunset: raw.city?.sunset ?? null }
  const nowSec = Date.now() / 1000
  const entries = raw.list ?? []

  const groups = new Map()
  for (const e of entries) {
    if (e.main?.temp == null) continue
    const key = localIsoDay(e.dt, offset)
    let group = groups.get(key)
    if (!group) {
      group = { key, points: [] }
      groups.set(key, group)
    }
    group.points.push(e)
  }

  const sortedKeys = [...groups.keys()].sort()
  const daily = sortedKeys.slice(0, 7).map((key, i) => {
    const points = groups.get(key).points
    const temps = points.map((p) => p.main.temp).filter((t) => t != null)
    const noon = points.reduce((best, p) => {
      const dist = Math.abs(new Date((p.dt + offset) * 1000).getUTCHours() - 12)
      const bestDist = best ? Math.abs(new Date((best.dt + offset) * 1000).getUTCHours() - 12) : 99
      return dist < bestDist ? p : best
    }, null)
    const pop = Math.max(0, ...points.map((p) => p.pop ?? 0))
    const rainTotal = points.reduce((s, p) => s + (p.rain?.['3h'] ?? 0), 0)
    const snowTotal = points.reduce((s, p) => s + (p.snow?.['3h'] ?? 0), 0)
    const humidityAvg =
      points.reduce((s, p) => s + (p.main?.humidity ?? 0), 0) / Math.max(1, points.length)
    const windMax = Math.max(0, ...points.map((p) => p.wind?.speed ?? 0))
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : localIsoDayName(new Date((+new Date(key) - offset) * 1000))
    return {
      key,
      label,
      max: Math.max(...temps),
      min: Math.min(...temps),
      pop,
      rainTotal,
      snowTotal,
      humidity: Math.round(humidityAvg),
      windMax,
      condition: noon ? toCondition(noon.weather?.[0]) : null,
      ts: noon?.dt ?? points[0]?.dt ?? null,
    }
  })

  const windowEnd = nowSec + HOURLY_WINDOW_HOURS * 3600
  const hourly = entries
    .filter((e) => e.dt >= nowSec - 3 * 3600 && e.dt <= windowEnd)
    .map((e) => ({
      dt: e.dt,
      localTime: localIsoTime(e.dt, offset),
      temp: e.main?.temp ?? null,
      feelsLike: e.main?.feels_like ?? null,
      pop: e.pop ?? 0,
      windSpeed: e.wind?.speed ?? null,
      windDeg: e.wind?.deg ?? null,
      humidity: e.main?.humidity ?? null,
      condition: toCondition(e.weather?.[0]),
      isDay: isDaytime(e.dt, sun),
      rain3h: e.rain?.['3h'] ?? 0,
      snow3h: e.snow?.['3h'] ?? 0,
    }))

  return {
    timezoneOffset: offset,
    sun: {
      sunrise: raw.city?.sunrise ?? null,
      sunset: raw.city?.sunset ?? null,
    },
    daily,
    hourly,
    series: entries.map((e) => ({
      dt: e.dt,
      localTime: localIsoTime(e.dt, offset),
      temp: e.main?.temp ?? null,
      feelsLike: e.main?.feels_like ?? null,
      pop: e.pop ?? 0,
      icon: e.weather?.[0]?.icon ?? null,
      isDay: isDaytime(e.dt, sun),
    })),
  }
}

function localIsoDayName(d) {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(d)
}

export function normalizeAirQuality(raw) {
  const item = raw.list?.[0]
  if (!item) return null
  const c = item.components ?? {}
  return {
    dt: item.dt ?? null,
    coord: raw.coord ?? null,
    aqi: item.main?.aqi ?? null,
    components: {
      co: limit(c.co),
      no: limit(c.no),
      no2: limit(c.no2),
      o3: limit(c.o3),
      so2: limit(c.so2),
      pm25: limit(c.pm2_5),
      pm10: limit(c.pm10),
      nh3: limit(c.nh3),
    },
  }
}

function limit(v) {
  return typeof v === 'number' ? v : null
}