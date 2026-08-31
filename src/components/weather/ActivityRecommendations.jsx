import { Footprints, Bike, Sun, Plane, Camera, Lightbulb } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import styles from './activity.module.css'

const ICONS = {
  footprints: Footprints,
  bike: Bike,
  sun: Sun,
  plane: Plane,
  camera: Camera,
}

const VERDICT_COLOR = {
  Ideal: 'var(--ok)',
  Good: '#3b82f6',
  Fair: 'var(--warn)',
  Poor: 'var(--danger)',
}

export default function ActivityRecommendations({ activities, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.grid} aria-hidden>
        <Skeleton height="8rem" />
        <Skeleton height="8rem" />
      </div>
    )
  }
  if (!activities || activities.length === 0) return null

  return (
    <div className={styles.grid}>
      {activities.map((a) => {
        const Icon = ICONS[a.icon] ?? Sun
        const color = VERDICT_COLOR[a.verdict]
        return (
          <div key={a.id} className={styles.card}>
            <div className={styles.top}>
              <span className={styles.icon}>
                <Icon size={18} strokeWidth={1.9} aria-hidden />
              </span>
              <span className={styles.name}>{a.name}</span>
              <span className={styles.verdict} style={{ color, borderColor: color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                {a.verdict}
              </span>
            </div>
            <div className={styles.bar} role="img" aria-label={`${a.name} suitability ${a.score} percent`}>
              <span className={styles.barFill} style={{ width: `${a.score}%`, background: color }} />
            </div>
            <ul className={styles.reasons}>
              {a.reasons.slice(0, 2).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )
      })}
      <div className={styles.note}>
        <Lightbulb size={14} aria-hidden />
        Scores are derived from live temperature, rain chance, wind, UV and air-quality data.
      </div>
    </div>
  )
}