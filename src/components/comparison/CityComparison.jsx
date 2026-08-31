import { useMemo, useState } from 'react'
import { Columns3, X, Sparkles } from 'lucide-react'
import GlassCard from '../ui/GlassCard'
import CitySearch from '../search/CitySearch'
import { useApp } from '../../state/appContext'
import { useFavorites } from '../../hooks/useLocalLists'
import { useWeather, useAirQuality } from '../../hooks/useWeather'
import { aqiLevel } from '../../services/aqi'
import { formatTemp, formatWind, formatTime } from '../../lib/format'
import { COMPARISON_LIMIT } from '../../config/constants'
import styles from './comparison.module.css'

const ROWS = [
  { key: 'temp', label: 'Temperature' },
  { key: 'feels', label: 'Feels like' },
  { key: 'humidity', label: 'Humidity' },
  { key: 'wind', label: 'Wind' },
  { key: 'precip', label: 'Rain today' },
  { key: 'aqi', label: 'Air quality' },
  { key: 'sunrise', label: 'Sunrise' },
  { key: 'sunset', label: 'Sunset' },
]

function samePlace(a, b) {
  return a && b && a.lat === b.lat && a.lon === b.lon
}

function CityColumn({ place, active, units, onSelect, onRemove, canRemove }) {
  const { current, daily, sun, timezoneOffset } = useWeather(place)
  const { air } = useAirQuality(place)
  const level = air ? aqiLevel(air.aqi) : null
  const todayPop = daily[0] != null ? Math.round(daily[0].pop * 100) : null

  const values = {
    temp: current ? formatTemp(current.temp, units) : '—',
    feels: current ? formatTemp(current.feelsLike, units) : '—',
    humidity: current && current.humidity != null ? `${current.humidity}%` : '—',
    wind: current ? formatWind(current.wind?.speed, units) : '—',
    precip: todayPop != null ? `${todayPop}%` : '—',
    aqi: air ? { label: level.label, color: level.color } : '—',
    sunrise: sun?.sunrise ? formatTime(sun.sunrise, timezoneOffset) : '—',
    sunset: sun?.sunset ? formatTime(sun.sunset, timezoneOffset) : '—',
  }

  return (
    <div className={`${styles.col} ${active ? styles.colActive : ''}`}>
      <div className={styles.headCell}>
        <button type="button" className={styles.cityName} title="Show this city" onClick={onSelect}>
          {place.name}
          <span className={styles.citySub}>{place.country || ' '}</span>
        </button>
        {canRemove && (
          <button
            type="button"
            className={styles.removeBtn}
            aria-label={`Remove ${place.name} from comparison`}
            onClick={onRemove}
          >
            <X size={13} aria-hidden />
          </button>
        )}
      </div>
      {ROWS.map(({ key }) => (
        <div key={key} className={`${styles.cell} ${values[key] === '—' ? styles.addCell : ''}`}>
          {key === 'aqi' && values.aqi !== '—' ? (
            <span>
              <span className={styles.aqiDot} style={{ background: values.aqi.color }} />
              {values.aqi.label}
            </span>
          ) : (
            values[key]
          )}
        </div>
      ))}
    </div>
  )
}

export default function CityComparison() {
  const { location, units, setLocation } = useApp()
  const { list: favorites } = useFavorites()
  const [extra, setExtra] = useState([])

  const addCity = (place) => {
    setExtra((cur) => {
      if (cur.some((c) => samePlace(c, place))) return cur
      return [...cur, place].slice(0, COMPARISON_LIMIT - 1)
    })
  }

  const list = useMemo(
    () => [location, ...extra.filter((c) => !samePlace(c, location))].slice(0, COMPARISON_LIMIT),
    [location, extra],
  )

  const suggestions = useMemo(
    () => favorites.filter((f) => !list.some((c) => samePlace(c, f))),
    [favorites, list],
  )
  const full = list.length >= COMPARISON_LIMIT

  return (
    <GlassCard title="Compare cities" icon={Columns3}>
      {list.length <= 1 ? (
        <div className={styles.placeholder}>
          Pick up to {COMPARISON_LIMIT - 1} more cities to compare side by side.
          <div className={styles.emptyHint}>Search below, or tap a favorite chip.</div>
        </div>
      ) : null}

      {list.length > 1 && (
        <div className={styles.scroll}>
          <div className={styles.table}>
            <div className={styles.labelCol}>
              <div className={styles.headCell} />
              {ROWS.map(({ key, label }) => (
                <div key={key} className={styles.cellLabel}>
                  {label}
                </div>
              ))}
            </div>
            {list.map((c) => (
              <CityColumn
                key={`${c.lat},${c.lon}`}
                place={c}
                active={samePlace(c, location)}
                units={units}
                onSelect={() => setLocation(c)}
                onRemove={() => setExtra((cur) => cur.filter((x) => !samePlace(x, c)))}
                canRemove={!samePlace(c, location)}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.picker}>
        <CitySearch onSelect={addCity} />
        {suggestions.length > 0 && !full && (
          <div className={styles.suggestRow}>
            {suggestions.map((s) => (
              <button
                key={`${s.lat},${s.lon}`}
                type="button"
                className={styles.suggest}
                onClick={() => addCity(s)}
              >
                <Sparkles size={12} aria-hidden />
                {s.name}
              </button>
            ))}
          </div>
        )}
        {full && (
          <div className={styles.emptyHint}>
            Max {COMPARISON_LIMIT} cities — remove one to add another.
          </div>
        )}
      </div>
    </GlassCard>
  )
}