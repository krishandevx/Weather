import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Radar, Map as MapIcon, LoaderCircle } from 'lucide-react'
import styles from './map.module.css'

const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json'
const RADAR_MAX_ZOOM = 12

const LEGEND = [
  { color: '#38bdf8', label: 'Light' },
  { color: '#22c55e', label: 'Moderate' },
  { color: '#facc15', label: 'Heavy' },
  { color: '#fb923c', label: 'Intense' },
  { color: '#ef4444', label: 'Extreme' },
]

function accentColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6'
}

export default function WeatherMap({ place, isLoading }) {
  const mapRef = useRef(null)
  const layersRef = useRef(null)
  const radarRef = useRef(null)
  const [radarOn, setRadarOn] = useState(false)
  const [radarFailed, setRadarFailed] = useState(false)
  const [radarLoading, setRadarLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Init the map once the container is actually mounted.
  // A callback ref guarantees the container exists (it renders after the
  // lazy-load completes), avoiding a dead empty map when the early render
  // shows the skeleton instead.
  const initRef = useRef(null)

  // Init the map once the container mounts AND weather is loaded (so the
  // container has final dimensions). The container is always rendered below;
  // we only create the Leaflet instance here.
  useEffect(() => {
    const el = initRef.current
    if (!el || mapRef.current || isLoading) return undefined
    const map = L.map(el, { zoomControl: true, attributionControl: false })
    map.setView([place.lat, place.lon], 10)
    L.control.attribution({ prefix: false }).addTo(map)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map)
    mapRef.current = map
    setReady(true)
    return () => {
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [isLoading, place.lat, place.lon])

  // Reposition + markers when the location changes.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !place) return undefined
    if (layersRef.current) layersRef.current.remove()
    layersRef.current = L.layerGroup().addTo(map)
    const color = accentColor()
    const icon = L.divIcon({
      className: '',
      html: `<span class="${styles.mapPin}"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.circle([place.lat, place.lon], {
      radius: 15000,
      color,
      weight: 2,
      opacity: 0.5,
      fillOpacity: 0.06,
    }).addTo(layersRef.current)
    L.marker([place.lat, place.lon], { icon, zIndexOffset: 1000 }).addTo(layersRef.current)
    map.flyTo([place.lat, place.lon], 10, { duration: 1.1 })
    return () => {
      if (layersRef.current) {
        layersRef.current.remove()
        layersRef.current = null
      }
    }
  }, [ready, place, place?.lat, place?.lon])

  // Real precipitation radar overlay (free RainViewer public tiles).
  useEffect(() => {
    if (!radarOn || !ready) {
      setRadarLoading(false)
      return undefined
    }
    let cancelled = false
    setRadarFailed(false)
    setRadarLoading(true)

    const enable = async () => {
      try {
        const res = await fetch(RAINVIEWER_INDEX)
        if (!res.ok) throw new Error('radar index failed')
        const data = await res.json()
        if (cancelled || !mapRef.current) return
        const frame = data.radar?.nowcast?.[0] ?? data.radar?.past?.[data.radar.past.length - 1]
        if (!frame) {
          setRadarFailed(true)
          setRadarLoading(false)
          return
        }
        const url = `${data.host}${frame.path}/{z}/{x}/{y}/256/1_0/0/1_0.png`
        radarRef.current = L.tileLayer(url, {
          opacity: 0.55,
          zIndex: 500,
          maxZoom: RADAR_MAX_ZOOM,
        }).addTo(mapRef.current)
        setRadarLoading(false)
      } catch {
        if (!cancelled) {
          setRadarFailed(true)
          setRadarLoading(false)
        }
      }
    }
    enable()
    return () => {
      cancelled = true
      if (radarRef.current) {
        radarRef.current.remove()
        radarRef.current = null
      }
    }
  }, [radarOn, ready])

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapContainer} ref={initRef} role="region" aria-label={`Map of ${place?.name ?? 'the selected location'}`} />
      <div className={styles.controls} role="group" aria-label="Map layers">
        <button
          type="button"
          className={styles.ctrlBtn}
          aria-pressed={!radarOn}
          onClick={() => setRadarOn(false)}
        >
          <MapIcon size={13} aria-hidden /> Base
        </button>
        <button
          type="button"
          className={`${styles.ctrlBtn} ${radarLoading ? styles.ctrlBtnLoading : ''}`}
          aria-pressed={radarOn}
          onClick={() => setRadarOn(true)}
          disabled={radarFailed || radarLoading}
          title="Real-time precipitation radar"
        >
          {radarLoading ? (
            <LoaderCircle size={13} className={styles.spinIcon} aria-hidden />
          ) : (
            <Radar size={13} aria-hidden />
          )}{' '}
          Radar
        </button>
      </div>
      {radarFailed && (
        <span className={styles.radarError} role="status">
          Radar unavailable right now
        </span>
      )}
      {radarOn && !radarFailed && !radarLoading && (
        <div className={styles.mapRadarLegend} aria-hidden>
          {LEGEND.map((s) => (
            <span key={s.label} className={styles.legendRow}>
              <span className={styles.legendSwatch} style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}