import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { Waves } from 'lucide-react'
import { aqiLevel, AQI_LEVELS } from '../../services/aqi'
import AnimatedNumber from '../ui/AnimatedNumber'
import styles from './aqi.module.css'

function AqiGauge({ aqi, color }) {
  const cx = 90
  const cy = 92
  const r = 66
  const n = AQI_LEVELS.length

  const arcPath = (from, to) => {
    const x1 = cx + r * Math.cos(from)
    const y1 = cy + r * Math.sin(from)
    const x2 = cx + r * Math.cos(to)
    const y2 = cy + r * Math.sin(to)
    const large = to - from > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  const segAngle = Math.PI / n
  const pointerAngle = Math.PI - (aqi / n) * Math.PI
  const px = cx + (r - 16) * Math.cos(pointerAngle)
  const py = cy + (r - 16) * Math.sin(pointerAngle)

  return (
    <svg
      width="180"
      height="100"
      viewBox="0 0 180 110"
      className={styles.gauge}
      role="img"
      aria-label={`Air quality index ${aqi} of 5`}
    >
      {AQI_LEVELS.map((level, i) => {
        const from = Math.PI - (i + 0.98) * segAngle
        const to = Math.PI - (i + 0.02) * segAngle
        const active = i === aqi - 1
        return (
          <path
            key={level.max}
            d={arcPath(from, to)}
            fill="none"
            stroke={level.color}
            strokeWidth={active ? 13 : 9}
            strokeLinecap="round"
            opacity={active ? 1 : 0.22}
            style={{ transition: 'stroke-width 300ms var(--ease-out), opacity 300ms var(--ease-out)' }}
          />
        )
      })}
      <line
        x1={cx}
        y1={cy}
        x2={px}
        y2={py}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />
      <circle cx={cx} cy={cy} r={5} fill={color} />
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize="26" fontWeight="680" fill="var(--text-1)">
        <AnimatedNumber value={aqi} format={(v) => Math.round(v)} />
      </text>
      <text x={cx} y={cy + 36} textAnchor="middle" fontSize="9" fill="var(--text-3)" letterSpacing="2">
        / 5
      </text>
    </svg>
  )
}

const COMPONENT_META = [
  ['pm25', 'PM2.5'],
  ['pm10', 'PM10'],
  ['o3', 'O3'],
  ['no2', 'NO2'],
  ['so2', 'SO2'],
  ['co', 'CO'],
]

export default function AirQualityCard({ air, isLoading, isError, error, onRetry }) {
  const level = air ? aqiLevel(air.aqi) : null

  if (isLoading && !air) {
    return (
      <div style={{ display: 'grid', gap: '0.75rem' }} aria-hidden>
        <Skeleton height="6rem" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="2.5rem" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Air quality unavailable"
        message={error?.message}
        code={error?.code}
        onRetry={onRetry}
      />
    )
  }

  if (!air) {
    return (
      <EmptyState
        icon={Waves}
        title="Air quality data is not available here"
        hint="Index updates a few times an hour."
      />
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.gaugeRow}>
        <AqiGauge aqi={air.aqi} color={level.color} />
        <div>
          <div className={styles.value} style={{ color: level.color }}>
            {level.label}
          </div>
          <p className={styles.note}>{level.note}</p>
        </div>
      </div>

      <div className={styles.components}>
        {COMPONENT_META.map(([key, label]) => {
          const v = air.components[key]
          if (v == null) return null
          return (
            <div key={key} className={styles.comp}>
              <div className={styles.compLabel}>{label}</div>
              <div className={styles.compValue}>
                {v} <span className={styles.compUnit}>µg/m³</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}