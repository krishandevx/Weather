import { dewPoint } from '../lib/psychrometrics'
import { estimateUvIndex } from '../lib/geometry'
import { formatTime } from '../lib/format'

/**
 * Deterministic insight rules over normalized weather data.
 * Every sentence is derived from real values — no generated fluff.
 * Designed so a future AI assistant can replace `generateInsights`
 * with the same input/output contract.
 */
export function generateInsights({ current, hourly, daily, sun, timezoneOffset, nowSec }) {
  if (!current) return []
  const out = []
  const push = (insight) => out.push(insight)

  // --- Rain windows -----------------------------------------------------
  const wet = hourly.filter((h) => h.pop >= 0.5)
  if (wet.length > 0) {
    const first = wet[0]
    const dryBefore = hourly.slice(0, hourly.indexOf(first)).every((h) => h.pop < 0.5)
    const peak = Math.max(...wet.map((h) => h.pop))
    if (dryBefore) {
      push({
        id: 'rain-onset',
        icon: 'umbrella',
        title: 'Rain moving in',
        body: `Rain probability rises to ${Math.round(peak * 100)}% after ${formatTime(
          first.dt,
          timezoneOffset,
          { hour: 'numeric' },
        )}.`,
      })
    }
  }

  const rainTotal = hourly.reduce((s, h) => s + (h.rain3h ?? 0), 0)
  if (rainTotal > 0.2) {
    push({
      id: 'rain-total',
      icon: 'cloud-rain',
      title: 'Wet stretch ahead',
      body: `${rainTotal.toFixed(1)} mm of rain is expected in the next 24 hours.`,
    })
  }

  // --- Tomorrow vs today ------------------------------------------------
  const [today, tomorrow] = daily
  if (today && tomorrow) {
    const delta = round1(tomorrow.max - today.max)
    if (Math.abs(delta) >= 2) {
      push({
        id: delta >= 0 ? 'warmer-tomorrow' : 'colder-tomorrow',
        icon: 'trending',
        title: delta >= 0 ? 'Warming up' : 'Cooling down',
        body: `Tomorrow's high is expected to be ${Math.abs(delta)}° ${delta >= 0 ? 'warmer' : 'cooler'} than today's ${Math.round(today.max)}°.`,
      })
    }
  }

  // --- Wind trend -------------------------------------------------------
  if (hourly.length >= 6) {
    const now6 = hourly.slice(0, 6).filter((h) => h.windSpeed != null)
    const later12 = hourly.slice(6, 18).filter((h) => h.windSpeed != null)
    if (now6.length >= 3 && later12.length >= 6) {
      const avgNow = now6.reduce((s, h) => s + h.windSpeed, 0) / now6.length
      const avgLater = later12.reduce((s, h) => s + h.windSpeed, 0) / later12.length
      const delta = avgLater - avgNow
      if (Math.abs(delta) >= 2.5) {
        push({
          id: delta >= 0 ? 'wind-up' : 'wind-down',
          icon: 'wind',
          title: delta >= 0 ? 'Winds strengthening' : 'Winds easing',
          body: `Average wind speed shifts from ${Math.round(avgNow * 3.6)} to ${Math.round(
            avgLater * 3.6,
          )} km/h over the next 18 hours.`,
        })
      }
    }
  }

  // --- Feels-like -------------------------------------------------------
  if (current.feelsLike != null && current.temp != null) {
    const diff = Math.round(current.feelsLike - current.temp)
    if (Math.abs(diff) >= 3) {
      push({
        id: 'feels-like',
        icon: 'thermometer',
        title: diff > 0 ? 'Feels warmer' : 'Feels colder',
        body: `It feels ${Math.abs(diff)}° ${diff > 0 ? 'warmer' : 'colder'} than the actual ${Math.round(
          current.temp,
        )}°.`,
      })
    }
  }

  // --- Dew point comfort ------------------------------------------------
  const dp = current.humidity != null ? dewPoint(current.temp, current.humidity) : null
  if (dp != null) {
    push({
      id: 'dew-point',
      icon: 'droplets',
      title: dp < 10 ? 'Crisp air' : dp < 16 ? 'Comfortable' : dp < 19 ? 'Hazy' : 'Humid',
      body: `Dew point is ${Math.round(dp)}° — ${
        dp < 10
          ? 'dry and comfortable'
          : dp < 16
            ? 'pleasantly balanced'
            : dp < 19
              ? 'feeling sticky outdoors'
              : 'heavy and muggy'
      }.`,
    })
  }

  // --- UV ------------------------------------------------------------------
  if (current.isDay && sun?.sunrise && sun?.sunset) {
    const uv = estimateUvIndex({ nowSec, sun, cloudCover: current.cloudCover })
    if (uv && uv.index >= 6) {
      const solarNoon = sun.sunrise + (sun.sunset - sun.sunrise) / 2
      push({
        id: 'uv-peak',
        icon: 'sun',
        title: 'High UV',
        body: `UV index is around ${Math.round(
          uv.index,
        )}. Strongest near ${formatTime(solarNoon, timezoneOffset, { hour: 'numeric' })} — use SPF 30+.`,
      })
    }
  }

  // --- Clear stretch -------------------------------------------------------
  const clearRun = longestDryRun(hourly, 0.3)
  if (clearRun && clearRun.length >= 3 && hourly.length > 3) {
    const last = clearRun[clearRun.length - 1]
    push({
      id: 'clear-stretch',
      icon: 'sun-cloud',
      title: 'Dry window',
      body: `Low rain chance until ${formatTime(last.dt, timezoneOffset, { hour: 'numeric' })} — good for outdoor plans.`,
    })
  }

  return out.slice(0, 4)
}

function longestDryRun(hourly, threshold) {
  let best = []
  let run = []
  for (const h of hourly) {
    if (h.pop < threshold && (h.rain3h ?? 0) === 0) {
      run.push(h)
      if (run.length > best.length) best = run
    } else {
      run = []
    }
  }
  return best
}

function round1(v) {
  return Math.round(v * 10) / 10
}