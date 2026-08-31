import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Umbrella, ChevronDown, Droplets, Wind as WindIcon, CloudRain } from 'lucide-react'
import { conditionVisual } from '../../services/condition'
import { formatTemp, formatWind, formatPrecip } from '../../lib/format'
import { EASE } from '../../lib/motion'
import Skeleton from '../ui/Skeleton'
import styles from './daily.module.css'

function DailySkeleton() {
  return (
    <div className={styles.list} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.btn} style={{ pointerEvents: 'none' }}>
            <Skeleton width="4rem" height="0.9rem" />
            <Skeleton width="2.25rem" height="2.25rem" />
            <Skeleton width="5rem" height="0.8rem" />
            <Skeleton width="6rem" height="0.5rem" />
            <Skeleton width="2.5rem" height="0.8rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DailyForecast({ daily, units, isLoading }) {
  const [openKey, setOpenKey] = useState(null)

  if (isLoading || daily.length === 0) return <DailySkeleton />

  const gmax = Math.max(...daily.map((d) => d.max))
  const gmin = Math.min(...daily.map((d) => d.min))

  return (
    <div className={styles.list}>
      {daily.map((d) => {
        const sky = conditionVisual(d.condition?.icon)
        const open = openKey === d.key
        const pctMin = rangePct(d.min, gmin, gmax)
        const pctMax = rangePct(d.max, gmin, gmax)
        return (
          <div key={d.key} className={`${styles.row} ${open ? styles.open : ''}`}>
            <button
              type="button"
              className={styles.btn}
              aria-expanded={open}
              onClick={() => setOpenKey(open ? null : d.key)}
            >
              <span className={styles.day}>{d.label}</span>
              <span className={styles.iconBox}>
                <sky.Icon size={18} strokeWidth={1.7} aria-hidden />
              </span>
              <span className={styles.cond}>{d.condition?.description ? cap(d.condition.description) : ''}</span>
              <span className={d.pop > 0 ? styles.pop : `${styles.pop} ${styles.popNone}`}>
                {d.pop > 0 ? <Umbrella size={12} aria-hidden /> : <CloudRain size={12} aria-hidden />}
                {d.pop > 0 ? `${Math.round(d.pop * 100)}%` : 'dry'}
              </span>
              <span className={styles.range}>
                <span>{formatTemp(d.max, units)}</span>
                <span className={styles.track}>
                  <span className={styles.spanTrack} style={{ left: `${pctMin}%`, width: `${Math.max(0, pctMax - pctMin)}%` }} />
                </span>
                <span className={styles.min}>{formatTemp(d.min, units)}</span>
              </span>
              <ChevronDown size={16} className={styles.caret} aria-hidden />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  className={styles.detail}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}
                >
                  {d.humidity != null && (
                    <span className={styles.dItem}>
                      <Droplets size={15} aria-hidden />
                      Humidity <span className={styles.dValue}>{d.humidity}%</span>
                    </span>
                  )}
                  {d.windMax > 0 && (
                    <span className={styles.dItem}>
                      <WindIcon size={15} aria-hidden />
                      Wind <span className={styles.dValue}>{formatWind(d.windMax, units)}</span>
                    </span>
                  )}
                  {d.rainTotal > 0 && (
                    <span className={styles.dItem}>
                      <CloudRain size={15} aria-hidden />
                      Rain <span className={styles.dValue}>{formatPrecip(d.rainTotal, units)}</span>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function rangePct(v, min, max) {
  if (max === min) return 50
  return Math.round(((v - min) / (max - min)) * 100)
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}