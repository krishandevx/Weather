import { Umbrella, Wind } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import { conditionVisual } from '../../services/condition'
import { formatTemp, formatTime, formatWind } from '../../lib/format'
import styles from './hourly.module.css'

function HourlySkeleton() {
  return (
    <div className={styles.scroller} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.tile}>
          <Skeleton width="2.5rem" height="0.7rem" />
          <Skeleton width="2rem" height="2rem" />
          <Skeleton width="2.5rem" height="1rem" />
        </div>
      ))}
    </div>
  )
}

export default function HourlyForecast({ hourly, current, timezoneOffset, units, isLoading }) {
  if (isLoading || !current) return <HourlySkeleton />

  const nowTile = {
    dt: current.dt,
    temp: current.temp,
    pop: null,
    windSpeed: current.wind?.speed,
    condition: current.condition,
    isNow: true,
  }
  const tiles = [nowTile, ...hourly]

  return (
    <div className={styles.scroller} role="list" aria-label="Hourly forecast">
      {tiles.map((t) => {
        const sky = conditionVisual(t.condition?.icon)
        return (
          <div
            key={t.isNow ? 'now' : t.dt}
            role="listitem"
            className={`${styles.tile} ${t.isNow ? styles.now : ''}`}
            title={t.condition?.description ?? ''}
          >
            {t.isNow ? (
              <span className={styles.nowPill}>Now</span>
            ) : (
              <span className={styles.time}>{formatTime(t.dt, timezoneOffset, { hour: 'numeric' })}</span>
            )}
            <sky.Icon size={26} strokeWidth={1.6} aria-hidden />
            <span className={styles.temp}>{formatTemp(t.temp, units)}</span>
            {t.pop == null ? (
              <span className={`${styles.precip} ${styles.precipNone}`}>—</span>
            ) : t.pop > 0 ? (
              <span className={styles.precip}>
                <Umbrella size={11} aria-hidden />
                {Math.round(t.pop * 100)}%
              </span>
            ) : (
              <span className={`${styles.precip} ${styles.precipNone}`}>dry</span>
            )}
            <span className={styles.wind}>
              <Wind size={10} aria-hidden />
              {formatWind(t.windSpeed, units)}
            </span>
          </div>
        )
      })}
    </div>
  )
}