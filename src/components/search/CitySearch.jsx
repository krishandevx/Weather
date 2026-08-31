import { useId, useRef, useState } from 'react'
import { Search, X, LoaderCircle, MapPin, Star, History, CornerDownLeft } from 'lucide-react'
import { useDebounced } from '../../hooks/useDebounce'
import { useCitySearch } from '../../hooks/useWeather'
import { useRecentSearches, useFavorites } from '../../hooks/useLocalLists'
import { useApp } from '../../state/appContext'
import { EASE } from '../../lib/motion'
import { AnimatePresence, motion } from 'framer-motion'
import styles from './search.module.css'

function optionKey(place) {
  return `${place.lat},${place.lon}`
}

function PlaceRow({ place, active, onSelect, favorite = false }) {
  const sub = [place.state, place.country].filter(Boolean).join(', ')
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={`${styles.option} ${active ? styles.optionActive : ''}`}
      onMouseEnter={onSelect}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        place.onPick?.()
      }}
    >
      <MapPin size={16} className={styles.optionIcon} aria-hidden />
      <span className={styles.optionName}>{place.name}</span>
      {sub && <span className={styles.optionSub}>{sub}</span>}
      {favorite && <Star size={14} className={styles.optionStar} aria-hidden />}
    </button>
  )
}

export default function CitySearch({ onSelect } = {}) {
  const { setLocation } = useApp()
  const { list: favorites } = useFavorites()
  const { list: recents, add: addRecent } = useRecentSearches()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounced = useDebounced(query)
  const listboxId = useId()
  const wrapRef = useRef(null)

  const { data: results, isFetching, isError, error } = useCitySearch(debounced)
  const searching = debounced.trim().length >= 2
  const options = searching ? (results ?? []) : []

  const select = (place) => {
    if (!place) return
    if (onSelect) {
      onSelect(place)
    } else {
      setLocation(place)
      addRecent(place)
    }
    setQuery('')
    setOpen(false)
    setActiveIndex(-1)
  }

  const pick = (index) => {
    if (index < 0 || index >= options.length) return
    select(options[index])
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true)
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(activeIndex)
    }
  }

  const showHome = !searching
  const showResults = searching
  const hasHomeContent = recents.length > 0 || favorites.length > 0

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <label className="visually-hidden" htmlFor="city-search">
        Search for a city
      </label>
      <div className={styles.inputShell}>
        <Search size={18} className={styles.icon} aria-hidden />
        <input
          id="city-search"
          className={styles.input}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          placeholder="Search city, region or country"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
        />
        {isFetching && query ? (
          <LoaderCircle size={16} className={styles.spinner} aria-hidden />
        ) : query ? (
          <button
            type="button"
            className={styles.clearBtn}
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setOpen(true)
            }}
          >
            <X size={15} aria-hidden />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label="City results"
            className={styles.dropdown}
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {showHome && (
              <>
                {!hasHomeContent && (
                  <div className={styles.status}>Type to search for a city, region or country.</div>
                )}
                {recents.length > 0 && (
                  <>
                    <div className={styles.sectionLabel}>
                      <History size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} aria-hidden />
                      Recent searches
                    </div>
                    {recents.map((p) => (
                      <PlaceRow key={optionKey(p)} place={{ ...p, onPick: () => select(p) }} onSelect={() => setActiveIndex(-1)} />
                    ))}
                  </>
                )}
                {favorites.length > 0 && (
                  <>
                    <div className={styles.sectionLabel}>
                      <Star size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} aria-hidden />
                      Favorites
                    </div>
                    {favorites.map((p) => (
                      <PlaceRow
                        key={optionKey(p)}
                        place={{ ...p, onPick: () => select(p) }}
                        favorite
                        onSelect={() => setActiveIndex(-1)}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {showResults && (
              <>
                {isFetching && (
                  <div className={styles.status}>
                    <LoaderCircle size={14} className={styles.spinner} aria-hidden /> Searching…
                  </div>
                )}
                {!isFetching && options.length === 0 && !isError && (
                  <div className={styles.status}>No places match “{debounced.trim()}”.</div>
                )}
                {!isFetching && isError && (
                  <div className={styles.status}>{error?.message ?? 'Search failed.'}</div>
                )}
                {!isFetching && options.map((r, i) => (
                  <PlaceRow
                    key={optionKey(r)}
                    place={{ ...r, onPick: () => select(r) }}
                    active={i === activeIndex}
                    onSelect={() => setActiveIndex(i)}
                  />
                ))}
              </>
            )}

            <div className={styles.hint}>
              <span>↑↓ to navigate</span>
              <span>
                <CornerDownLeft size={11} style={{ verticalAlign: '-1px' }} aria-hidden /> to select
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}