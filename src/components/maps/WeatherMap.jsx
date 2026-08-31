import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Radar, Map as MapIcon } from 'lucide-react'
import Skeleton from '../ui/Skeleton'
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
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(null)
  const radarRef = useRef(null)
  const [radarOn, setRadarOn] = useState(false)
  const [radarFailed, setRadarFailed] = useState(false)

  // Init the map once.
  useEffect(() => {
    const el = elRef.current
    if (!el || mapRef.current) return undefined
    const map = L.map(el, { zoomControl: true, attributionControl: false })
    map.setView([place.lat, place.lon], 10)
    L.control.attribution({ prefix: false }).addTo(map)
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reposition + markers when the location changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !place) return undefined
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
  }, [place, place?.lat, place?.lon])

  // Real precipitation radar overlay (free RainViewer public tiles).
  useEffect(() => {
    if (!radarOn) return undefined
    let cancelled = false
    setRadarFailed(false)

    const enable = async () => {
      try {
        const res = await fetch(RAINVIEWER_INDEX)
        if (!res.ok) throw new Error('radar index failed')
        const data = await res.json()
        if (cancelled || !mapRef.current) return
        const frame = data.radar?.nowcast?.[0] ?? data.radar?.past?.[data.radar.past.length - 1]
        if (!frame) {
          setRadarFailed(true)
          return
        }
        const url = `${data.host}${frame.path}/{z}/{x}/{y}/256/1_0/0/1_0.png`
        radarRef.current = L.tileLayer(url, {
          opacity: 0.55,
          zIndex: 500,
          maxZoom: RADAR_MAX_ZOOM,
        }).addTo(mapRef.current)
      } catch {
        if (!cancelled) setRadarFailed(true)
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
  }, [radarOn])

  if (isLoading) {
    return <Skeleton height="22rem" />
  }

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapContainer} ref={elRef} role="region" aria-label={`Map of ${place?.name ?? 'the selected location'}`} />
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
          className={styles.ctrlBtn}
          aria-pressed={radarOn}
          onClick={() => setRadarOn(true)}
          disabled={radarFailed}
          title="Real-time precipitation radar"
        >
          <Radar size={13} aria-hidden /> Radar
        </button>
      </div>
      {radarFailed && (
        <span className={styles.radarError} role="status">
          Radar unavailable right now
        </span>
      )}
      {radarOn && !radarFailed && (
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