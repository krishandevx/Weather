import { memo } from 'react'
import { Star, Clock } from 'lucide-react'
import { useApp } from '../../state/appContext'
import { useFavorites } from '../../hooks/useLocalLists'
import { useNow } from '../../hooks/useNow'
import { conditionVisual } from '../../services/condition'
import { currentSummary } from '../../services/summary'
import { formatTemp, formatTime, formatTimeDate } from '../../lib/format'
import Skeleton from '../ui/Skeleton'
import AnimatedNumber from '../ui/AnimatedNumber'
import styles from './hero.module.css'

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

function HeroSkeleton() {
  return (
    <div className={styles.hero} aria-hidden>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <Skeleton width="3rem" height="3rem" circle />
        <Skeleton width="9rem" height="1.25rem" />
        <Skeleton width="13rem" height="5.5rem" />
      </div>
      <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
        <Skeleton width="7rem" height="1rem" />
        <Skeleton width="20rem" height="1rem" />
        <Skeleton width="16rem" height="1rem" />
      </div>
    </div>
  )
}

function WeatherHero({ current, timezoneOffset, isLoading }) {
  const { units, location } = useApp()
  const { has, toggle } = useFavorites()
  const now = useNow()

  if (isLoading || !current) return <HeroSkeleton />

  const sky = conditionVisual(current?.condition?.icon)
  const summary = currentSummary(current, units)
  const favorite = has(location)

  return (
    <section className={`${styles.hero} ${styles[`scene${cap(sky.scene)}`]}`} aria-label="Current weather">
      <div className={styles.glow} aria-hidden />
      <div>
        <div className={styles.meta}>
          <div className={styles.place}>
            <span className={styles.placeName}>{current.placeName}</span>
            {current.country && <span className={styles.placeRegion}>{current.country}</span>}
          </div>
          <span className={styles.chip}>{formatTimeDate(now.getTime() / 1000, timezoneOffset)}</span>
        </div>

        <div className={styles.tempRow}>
          <span className={styles.temp}>
            <AnimatedNumber value={current.temp} format={(v) => formatTemp(v, units)} />
            <span className="visually-hidden">
              {units === 'metric' ? 'degrees Celsius' : 'degrees Fahrenheit'}
            </span>
          </span>
          <span className={styles.condIcon}>
            <sky.Icon size={44} strokeWidth={1.4} aria-hidden />
          </span>
        </div>

        <p className={styles.condText}>
          {current.condition?.description && cap(current.condition.description)}
          <span className="visually-hidden">, </span>
          <span className={styles.hilo}>
            H {formatTemp(current.tempMax, units)} · L {formatTemp(current.tempMin, units)}
          </span>
        </p>

        <p className={styles.summary}>{summary}</p>

        <div className={styles.updated}>
          <Clock size={13} aria-hidden />
          <span>
            Updated {formatTime(current.dt, timezoneOffset)} · local time{' '}
            {formatTime(now.getTime() / 1000, timezoneOffset)}
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={`icon-btn ${styles.favFab}`}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `Remove ${current.placeName} from favorites`
              : `Save ${current.placeName} to favorites`
          }
          onClick={() => toggle(location)}
        >
          <Star
            size={19}
            fill={favorite ? 'currentColor' : 'none'}
            className={favorite ? styles.favOn : ''}
            aria-hidden
          />
        </button>
      </div>
    </section>
  )
}

export default memo(WeatherHero)