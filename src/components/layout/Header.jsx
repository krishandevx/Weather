import { Moon, Sun, LocateFixed, LoaderCircle } from 'lucide-react'
import { useApp } from '../../state/appContext'
import { useGeolocation, GeoStatus } from '../../hooks/useGeolocation'
import { useWeather } from '../../hooks/useWeather'
import CitySearch from '../search/CitySearch'
import Logo from './Logo'
import styles from './header.module.css'

function UnitsToggle() {
  const { units, setUnits } = useApp()
  return (
    <div className={styles.segmented} role="group" aria-label="Temperature unit">
      <button
        type="button"
        className={styles.seg}
        aria-pressed={units === 'metric'}
        onClick={() => setUnits('metric')}
      >
        °C
      </button>
      <button
        type="button"
        className={styles.seg}
        aria-pressed={units === 'imperial'}
        onClick={() => setUnits('imperial')}
      >
        °F
      </button>
    </div>
  )
}

export default function Header() {
  const { location, isDark, toggleTheme, geoStatus } = useApp()
  const { isFetching } = useWeather(location)
  const { status, locate } = useGeolocation()
  const locating = status === GeoStatus.LOCATING || geoStatus === 'locating'
  const live = isFetching ? 'Updating' : 'Live'
  const geoDenied = geoStatus === 'denied'

  return (
    <header className={styles.header}>
      <div className={`atmos-container ${styles.inner}`}>
        <div className={styles.brand}>
          <Logo />
          <div className={styles.wordmark}>
            <span className={styles.wordmarkName}>Atmos</span>
            <span className={styles.wordmarkTag}>Weather intelligence</span>
          </div>
          <span className={styles.status} role="status">
            <span className={`${styles.dot} ${isFetching ? styles.dotFetching : ''}`} aria-hidden />
            {live}
          </span>
        </div>

        <div className={styles.searchCol}>
          <CitySearch />
        </div>

        <div className={styles.controls}>
          <UnitsToggle />
          <button
            type="button"
            className={`icon-btn ${geoDenied ? styles.geoDenied : ''}`}
            aria-label={geoDenied ? 'Location access denied — click to retry' : 'Use my location'}
            title={geoDenied ? 'Location access denied. Click to retry.' : 'Use my location'}
            onClick={locate}
            disabled={locating}
          >
            {locating ? (
              <LoaderCircle size={18} className={styles.spin} aria-hidden />
            ) : (
              <LocateFixed size={18} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            onClick={toggleTheme}
          >
            {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </header>
  )
}