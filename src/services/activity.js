import { aqiLevel } from './aqi'

/**
 * Deterministic scoring engine.
 * Every score is built from real metrics + explicit reasons.
 */

const WIND_KMH = (ms) => ms * 3.6

function tempScore(tempC) {
  if (tempC < -5) return { s: 10, note: 'very cold' }
  if (tempC < 5) return { s: 30, note: 'cold' }
  if (tempC < 10) return { s: 60, note: 'chilly' }
  if (tempC <= 26) return { s: 95, note: 'mild' }
  if (tempC <= 32) return { s: 65, note: 'warm' }
  return { s: 25, note: 'very hot' }
}

function precipScore(pop, rainH) {
  if ((rainH ?? 0) > 0.3) return { s: 10, note: `${rainH.toFixed(1)} mm of rain in the next few hours` }
  if (pop >= 0.6) return { s: 25, note: `rain chance ${Math.round(pop * 100)}%` }
  if (pop >= 0.3) return { s: 60, note: `rain chance ${Math.round(pop * 100)}%` }
  return { s: 100, note: 'low rain chance' }
}

function windScore(ms) {
  const kmh = WIND_KMH(ms ?? 0)
  if (kmh > 45) return { s: 10, note: `${Math.round(kmh)} km/h wind` }
  if (kmh > 28) return { s: 45, note: `${Math.round(kmh)} km/h wind` }
  if (kmh > 15) return { s: 75, note: `breezy at ${Math.round(kmh)} km/h` }
  return { s: 95, note: `light wind at ${Math.round(kmh)} km/h` }
}

function aqiScore(aqi) {
  const level = aqiLevel(aqi)
  if (!level) return { s: 90, note: 'air quality unknown' }
  if (aqi >= 4) return { s: 15, note: `${level.label} air quality` }
  if (aqi === 3) return { s: 55, note: 'moderate air quality' }
  return { s: 95, note: 'good air quality' }
}

function uvScore(uv) {
  if (uv == null) return null
  if (uv.index >= 8) return { s: 35, note: `high UV index ${Math.round(uv.index)}` }
  if (uv.index >= 6) return { s: 60, note: `UV index ${Math.round(uv.index)} around midday` }
  return null
}

function visibilityScore(m) {
  if (m == null) return null
  if (m >= 8000) return { s: 100, note: 'clear visibility' }
  if (m >= 4000) return { s: 70, note: `${(m / 1000).toFixed(1)} km visibility` }
  return { s: 35, note: `${(m / 1000).toFixed(1)} km visibility` }
}

function combine(factors) {
  const total = factors.reduce((sum, f) => sum + f.s, 0)
  const avg = total / Math.max(1, factors.length)
  const score = Math.max(0, Math.min(100, avg))
  const verdict = score >= 80 ? 'Ideal' : score >= 60 ? 'Good' : score >= 35 ? 'Fair' : 'Poor'
  return { score: Math.round(score), verdict, reasons: factors.map((f) => f.note).filter(Boolean) }
}

function buildFactors(input, picks) {
  const current = input.current
  const nowPop = input.nextPop
  const nextRain = input.nextRain
  const map = {
    temp: tempScore(current.temp),
    precip: precipScore(nowPop, nextRain),
    wind: windScore(current.wind?.speed),
    aqi: aqiScore(input.aqi),
    uv: uvScore(input.uv),
    visibility: visibilityScore(current.visibility),
  }
  return picks.map((k) => map[k]).filter(Boolean)
}

/** @returns Array<{ id, name, icon, score, verdict, reasons }> */
export function evaluateActivities(input) {
  const current = input.current
  if (!current) return []

  const nextPop = input.hourly?.[0]?.pop ?? 0
  const nextRain = input.hourly?.[0]?.rain3h ?? 0

  const run = {
    id: 'run',
    name: 'Running',
    icon: 'footprints',
    ...combine(buildFactors({ ...input, nextPop, nextRain }, ['temp', 'precip', 'wind', 'aqi'])),
  }
  const cycle = {
    id: 'cycle',
    name: 'Cycling',
    icon: 'bike',
    ...combine(buildFactors({ ...input, nextPop, nextRain }, ['temp', 'precip', 'wind', 'aqi'])),
  }
  const outdoor = {
    id: 'outdoor',
    name: 'Outdoor plans',
    icon: 'sun',
    ...combine(buildFactors({ ...input, nextPop, nextRain }, ['temp', 'precip', 'uv', 'aqi'])),
  }
  const travel = {
    id: 'travel',
    name: 'Travel',
    icon: 'plane',
    ...combine(buildFactors({ ...input, nextPop, nextRain }, ['visibility', 'precip', 'wind'])),
  }
  const photo = {
    id: 'photo',
    name: 'Photography',
    icon: 'camera',
    ...photography(input, nextPop, nextRain),
  }

  if ((current.wind?.speed ?? 0) * 3.6 > 28) {
    cycle.reasons.push(`strong ${Math.round(current.wind.speed * 3.6)} km/h wind`)
  }

  return [run, cycle, outdoor, travel, photo]
}

function photography(input, nowPop, nextRain) {
  const current = input.current
  const factors = buildFactors({ ...input, nextPop: nowPop, nextRain }, ['visibility', 'precip'])
  const cloud = current?.cloudCover ?? null
  if (cloud != null && cloud >= 60) factors.push({ s: 80, note: `${cloud}% cloud cover — soft diffused light` })
  if (cloud != null && cloud <= 20) factors.push({ s: 55, note: 'clear skies — harsh midday contrast' })
  if (input.nowSec != null && input.sun?.sunrise && input.sun?.sunset) {
    const dayLen = input.sun.sunset - input.sun.sunrise
    const solarNoon = input.sun.sunrise + dayLen / 2
    const distToNoon = Math.abs(input.nowSec - solarNoon)
    if (distToNoon < dayLen * 0.3) factors.push({ s: 40, note: 'midday sun — harsh shadows' })
    else factors.push({ s: 85, note: 'outside peak sun — better light' })
  } else {
    factors.push({ s: 60, note: 'light conditions neutral' })
  }
  return combine(factors)
}