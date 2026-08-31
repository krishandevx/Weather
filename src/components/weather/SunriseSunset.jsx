import { Sunrise, Sunset, CloudSun, MoonStar } from 'lucide-react'
import { useNow } from '../../hooks/useNow'
import { clamp } from '../../lib/geometry'
import { formatTime } from '../../lib/format'
import Skeleton from '../ui/Skeleton'
import styles from './sunrise.module.css'

const CX = 150
const CY = 132
const R = 122

function posOnArc(fraction) {
  const angle = clamp(fraction, 0, 1) * Math.PI
  return {
    x: CX - R * Math.cos(angle),
    y: CY - R * Math.sin(angle),
  }
}

export default function SunriseSunset({ sun, timezoneOffset, isLoading }) {
  const now = useNow()

  if (isLoading || !sun?.sunrise || !sun?.sunset) {
    return <Skeleton height="12rem" />
  }

  const nowSec = now.getTime() / 1000
  const { sunrise, sunset } = sun
  const inDay = nowSec >= sunrise && nowSec < sunset
  const fraction = (nowSec - sunrise) / Math.max(1, sunset - sunrise)
  const pos = posOnArc(fraction)
  const night = !inDay

  const remainingMin = Math.max(0, Math.round((sunset - nowSec) / 60))
  const dayLenMin = Math.round((sunset - sunrise) / 60)
  const status = night
    ? `Night — ${nowSec < sunrise ? 'sunrise in' : 'sunset was'} ${hoursMinutes(
        nowSec < sunrise ? sunrise - nowSec : nowSec - sunset,
      )}`
    : `Remaining daylight ${hoursMinutes(remainingMin)} of ${hoursMinutes(dayLenMin)}`

  const SunIcon = night ? MoonStar : CloudSun

  return (
    <div className={`${styles.wrap} ${night ? styles.night : ''}`}>
      <svg viewBox="0 0 300 170" className={styles.svg} role="img" aria-label="Sunrise and sunset times">
        <defs>
          <linearGradient id="sun-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.24" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path className={styles.dayArea} d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY} L ${CX + R} 0 L ${CX - R} 0 Z`} />
        <path className={styles.arcBase} d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} className={styles.horizon} />

        {inDay && (
          <path
            className={styles.sunTrack}
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${pos.x} ${pos.y}`}
          />
        )}

        <g transform={`translate(${pos.x} ${pos.y})`}>
          {inDay && <circle r={13} className={styles.sunPulse} />}
          <circle r={7} className={styles.sunDot} />
        </g>

        <text x={CX - R} y={CY + 20} textAnchor="middle" className={styles.marker}>
          Sunrise
        </text>
        <text x={CX + R} y={CY + 20} textAnchor="middle" className={styles.marker}>
          Sunset
        </text>
      </svg>

      <div className={styles.endPoints}>
        <span className={styles.endLabel}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sunrise size={15} aria-hidden /> Sunrise
          </span>
          <span className={styles.endTime}>{formatTime(sunrise, timezoneOffset)}</span>
        </span>
        <span className={styles.endLabel} style={{ alignItems: 'flex-end' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Sunset size={15} aria-hidden /> Sunset
          </span>
          <span className={styles.endTime}>{formatTime(sunset, timezoneOffset)}</span>
        </span>
      </div>

      <div className={styles.status}>
        <SunIcon size={15} aria-hidden />
        {status}
      </div>
    </div>
  )
}

function hoursMinutes(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}