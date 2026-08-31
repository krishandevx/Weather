import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudSunRain,
  CloudMoonRain,
  Cloud,
  Cloudy,
  CloudFog,
  CloudLightning,
  CloudDrizzle,
  CloudSnow,
} from 'lucide-react'

/**
 * OWM weather-icon codes (e.g. "04d") → our visual design system.
 * `scene` drives the atmospheric background; `Icon` is the foreground glyph.
 */
const ICON_MAP = {
  '01d': { Icon: Sun, scene: 'clear' },
  '01n': { Icon: Moon, scene: 'clear' },
  '02d': { Icon: CloudSun, scene: 'clouds' },
  '02n': { Icon: CloudMoon, scene: 'clouds' },
  '03d': { Icon: Cloud, scene: 'clouds' },
  '03n': { Icon: Cloud, scene: 'clouds' },
  '04d': { Icon: Cloudy, scene: 'clouds' },
  '04n': { Icon: Cloudy, scene: 'clouds' },
  '09d': { Icon: CloudDrizzle, scene: 'rain' },
  '09n': { Icon: CloudDrizzle, scene: 'rain' },
  '10d': { Icon: CloudSunRain, scene: 'rain' },
  '10n': { Icon: CloudMoonRain, scene: 'rain' },
  '11d': { Icon: CloudLightning, scene: 'storm' },
  '11n': { Icon: CloudLightning, scene: 'storm' },
  '13d': { Icon: CloudSnow, scene: 'snow' },
  '13n': { Icon: CloudSnow, scene: 'snow' },
  '50d': { Icon: CloudFog, scene: 'fog' },
  '50n': { Icon: CloudFog, scene: 'fog' },
}

export function conditionVisual(iconCode) {
  const hit = ICON_MAP[iconCode]
  if (!hit) return { Icon: Cloud, scene: 'clouds', isDay: true }
  return { ...hit, isDay: iconCode?.endsWith('d') ?? true }
}