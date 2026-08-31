import { Droplets, Wind, Navigation, Gauge, Eye, Cloud, Thermometer, Sun } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import { useApp } from '../../state/appContext'
import { useNow } from '../../hooks/useNow'
import { windDirection } from '../../lib/geometry'
import { estimateUvIndex } from '../../lib/geometry'
import { dewPoint } from '../../lib/psychrometrics'
import { formatWind, formatVisibility, formatPressure, formatTemp, formatPrecip } from '../../lib/format'
import Skeleton from '../ui/Skeleton'
import AnimatedNumber from '../ui/AnimatedNumber'
import styles from './metrics.module.css'

function Metric({ icon: Icon, label, value, sub, arrowDeg, estimated }) {
  return (
    <GlassCard className={styles.card} hover>
      <span className={styles.icon}>
        <Icon size={20} strokeWidth={1.8} aria-hidden />
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {estimated && <span className={styles.est}>est.</span>}
      </span>
      {sub && (
        <span className={styles.sub}>
          {arrowDeg != null && (
            <Navigation size={12} className={styles.arrow} style={{ transform: `rotate(${arrowDeg}deg)` }} aria-hidden />
          )}
          {sub}
        </span>
      )}
    </GlassCard>
  )
}

function MetricsSkeleton() {
  return (
    <div className={styles.metrics} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <GlassCard key={i} className={styles.card}>
          <Skeleton width="2.5rem" height="2.5rem" />
          <Skeleton width="5.5rem" height="0.75rem" />
          <Skeleton width="4rem" height="1.4rem" />
        </GlassCard>
      ))}
    </div>
  )
}

export default function WeatherMetrics({ current, sun, isLoading }) {
  const { units } = useApp()
  const now = useNow()

  if (isLoading || !current) return <MetricsSkeleton />

  const dir = windDirection(current.wind?.deg)
  const uv = estimateUvIndex({
    nowSec: now.getTime() / 1000,
    sun: sun ?? current.sun,
    cloudCover: current.cloudCover,
  })
  const dp = dewPoint(current.temp, current.humidity)
  const showRain = current.rain1h || current.snow1h

  return (
    <div className={styles.metrics}>
      <Metric
        icon={Droplets}
        label="Humidity"
        value={<AnimatedNumber value={current.humidity} format={(v) => `${Math.round(v)}%`} />}
        sub={dp != null ? `Dew point ${formatTemp(dp, units, { round: true })}` : undefined}
      />
      <Metric
        icon={Wind}
        label="Wind"
        value={
          <AnimatedNumber value={current.wind?.speed ?? null} format={(v) => formatWind(v, units)} />
        }
        sub={dir.deg != null ? `Gust ${formatWind(current.wind.gust, units)}` : undefined}
      />
      <Metric
        icon={Navigation}
        label="Direction"
        value={dir.cardinal}
        arrowDeg={current.wind?.deg}
        sub={current.wind?.deg != null ? `${Math.round(current.wind.deg)}°` : undefined}
      />
      <Metric
        icon={Gauge}
        label="Pressure"
        value={
          <AnimatedNumber value={current.pressure ?? null} format={(v) => formatPressure(v)} />
        }
        sub={current.pressure ? (current.pressure > 1013 ? 'High pressure' : current.pressure < 1008 ? 'Low pressure' : 'Near normal') : undefined}
      />
      <Metric
        icon={Eye}
        label="Visibility"
        value={
          <AnimatedNumber value={current.visibility ?? null} format={(v) => formatVisibility(v)} />
        }
      />
      <Metric
        icon={Cloud}
        label="Cloud cover"
        value={<AnimatedNumber value={current.cloudCover ?? null} format={(v) => `${Math.round(v)}%`} />}
      />
      <Metric
        icon={Sun}
        label="UV index"
        value={
          <AnimatedNumber value={uv ? uv.index : null} format={(v) => (v == null ? '—' : String(Math.round(v)))} />
        }
        estimated
        sub={uv ? uvLabel(uv.index) : 'At night'}
      />
      {showRain ? (
        <Metric
          icon={Droplets}
          label={current.snow1h ? 'Snow (1h)' : 'Rain (1h)'}
          value={
            <AnimatedNumber
              value={current.rain1h || current.snow1h || 0}
              format={(v) => formatPrecip(v, units)}
            />
          }
        />
      ) : null}
      {!showRain && (
        <Metric
          icon={Thermometer}
          label="Feels like"
          value={
            <AnimatedNumber value={current.feelsLike ?? null} format={(v) => formatTemp(v, units)} />
          }
        />
      )}
    </div>
  )
}

function uvLabel(index) {
  if (index < 3) return 'Low exposure'
  if (index < 6) return 'Moderate'
  if (index < 8) return 'High — use SPF 30+'
  if (index < 11) return 'Very high'
  return 'Extreme'
}