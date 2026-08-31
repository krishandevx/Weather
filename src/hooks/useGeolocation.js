import { useCallback, useRef, useState } from 'react'
import { useApp } from '../state/appContext'
import { reverseGeocode } from '../api/weatherApi'

export const GeoStatus = {
  IDLE: 'idle',
  LOCATING: 'locating',
  OK: 'ok',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  TIMEOUT: 'timeout',
  UNSUPPORTED: 'unsupported',
}

export const GEO_MESSAGES = {
  [GeoStatus.DENIED]: 'Location access was denied. Allow it in your browser settings and try again.',
  [GeoStatus.UNAVAILABLE]: "We couldn't locate your device right now.",
  [GeoStatus.TIMEOUT]: 'Locating your device took too long. Check your connection and retry.',
  [GeoStatus.UNSUPPORTED]: 'Geolocation is not supported by this browser.',
}

export function useGeolocation() {
  const { setLocation } = useApp()
  const [status, setStatus] = useState(GeoStatus.IDLE)
  const [error, setError] = useState(null)
  const busyRef = useRef(false)

  const locate = useCallback(async () => {
    if (busyRef.current) return
    if (!('geolocation' in navigator)) {
      setStatus(GeoStatus.UNSUPPORTED)
      setError(GEO_MESSAGES[GeoStatus.UNSUPPORTED])
      return
    }
    busyRef.current = true
    setStatus(GeoStatus.LOCATING)
    setError(null)

    const result = await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ ok: true, coords: position.coords }),
        (err) =>
          resolve({
            ok: false,
            code: err?.code ?? null,
          }),
        { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
      )
    })

    busyRef.current = false

    if (!result.ok) {
      const code = result.code
      const next =
        code === 1
          ? GeoStatus.DENIED
          : code === 3
            ? GeoStatus.TIMEOUT
            : GeoStatus.UNAVAILABLE
      setStatus(next)
      setError(GEO_MESSAGES[next])
      return
    }

    const { latitude, longitude } = result.coords
    let place = null
    try {
      place = await reverseGeocode({ lat: latitude, lon: longitude })
    } catch {
      place = null
    }
    setLocation({
      name: place?.name ?? 'My location',
      state: place?.state ?? null,
      country: place?.country ?? '',
      lat: latitude,
      lon: longitude,
    })
    setStatus(GeoStatus.OK)
  }, [setLocation])

  return { status, error, locate }
}