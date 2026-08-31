import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useApp } from '../../state/appContext'
import { useFavorites } from '../../hooks/useLocalLists'
import { useWeather } from '../../hooks/useWeather'
import { conditionVisual } from '../../services/condition'
import { formatTemp } from '../../lib/format'
import styles from './favorites.module.css'

function FavoriteChip({ place }) {
  const { location, setLocation, units } = useApp()
  const { remove } = useFavorites()
  const { current } = useWeather(place)
  const active = location && location.lat === place.lat && location.lon === place.lon
  const sky = conditionVisual(current?.condition?.icon)

  return (
    <div className={`${styles.chip} ${active ? styles.chipActive : ''}`}>
      <button
        type="button"
        className={styles.main}
        aria-pressed={active}
        onClick={() => setLocation(place)}
      >
        {current ? (
          <sky.Icon size={20} strokeWidth={1.7} aria-hidden />
        ) : (
          <span className={styles.dots} aria-hidden>…</span>
        )}
        <span className={styles.city}>
          <span className={styles.name}>{place.name}</span>
          <span className={styles.temp}>
            {current ? (
              formatTemp(current.temp, units)
            ) : (
              <span className={styles.tempName}>loading</span>
            )}
          </span>
        </span>
      </button>
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove ${place.name} from favorites`}
        onClick={() => remove(place)}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}

export default memo(function FavoriteCities() {
  const { list } = useFavorites()
  if (list.length === 0) return null
  return (
    <div className={styles.wrap} role="list" aria-label="Favorite cities">
      <AnimatePresence initial={false}>
        {list.map((p) => (
          <motion.div
            key={`${p.lat},${p.lon}`}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <FavoriteChip place={p} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})