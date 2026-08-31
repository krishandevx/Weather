import {
  Umbrella,
  CloudRain,
  TrendingUp,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  CloudSun,
  Sparkles,
} from 'lucide-react'
import Skeleton from '../ui/Skeleton'
import { motion } from 'framer-motion'
import { EASE } from '../../lib/motion'
import styles from './insights.module.css'

const ICONS = {
  umbrella: Umbrella,
  'cloud-rain': CloudRain,
  trending: TrendingUp,
  wind: Wind,
  thermometer: Thermometer,
  droplets: Droplets,
  sun: Sun,
  'sun-cloud': CloudSun,
}

export default function WeatherInsights({ insights, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.grid} aria-hidden>
        <Skeleton height="5.5rem" />
        <Skeleton height="5.5rem" />
      </div>
    )
  }
  if (!insights || insights.length === 0) {
    return (
      <div className={styles.empty}>
        <Sparkles size={18} aria-hidden />
        Insights will appear as we analyze the forecast.
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {insights.map((ins, i) => {
        const Icon = ICONS[ins.icon] ?? Sparkles
        return (
          <motion.div
            key={ins.id}
            className={styles.tile}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: EASE }}
          >
            <span className={styles.icon}>
              <Icon size={17} strokeWidth={1.9} aria-hidden />
            </span>
            <span className={styles.body}>
              <span className={styles.title}>{ins.title}</span>
              <span className={styles.text}>{ins.body}</span>
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}