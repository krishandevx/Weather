import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_LOCATION, DEFAULT_UNITS, STORAGE_KEYS } from '../config/constants'
import { reverseGeocode } from '../api/weatherApi'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isPlace(p) {
  return Boolean(p && typeof p.lat === 'number' && typeof p.lon === 'number')
}

function initialLocation() {
  const stored = readJson(STORAGE_KEYS.lastLocation)
  if (isPlace(stored)) {
    return { name: stored.name ?? 'Selected location', ...stored }
  }
  return DEFAULT_LOCATION
}

function hasSavedLocation() {
  return isPlace(readJson(STORAGE_KEYS.lastLocation))
}

function initialUnits() {
  const v = localStorage.getItem(STORAGE_KEYS.units)
  return v === 'imperial' || v === 'metric' ? v : DEFAULT_UNITS
}

function initialTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1120' : '#eaf2fb')
}

export function AppProvider({ children }) {
  const [location, _setLocation] = useState(initialLocation)
  const [units, _setUnits] = useState(initialUnits)
  const [theme, _setTheme] = useState(initialTheme)
  const [geoStatus, setGeoStatus] = useState('idle')
  const geoTriedRef = useRef(false)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Auto-detect location on first visit (no saved location).
  useEffect(() => {
    if (geoTriedRef.current) return
    if (hasSavedLocation()) {
      setGeoStatus('skipped')
      return
    }
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported')
      return
    }
    geoTriedRef.current = true
    setGeoStatus('locating')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        let place = null
        try {
          place = await reverseGeocode({ lat: latitude, lon: longitude })
        } catch {
          place = null
        }
        const next = {
          name: place?.name ?? 'My location',
          state: place?.state ?? null,
          country: place?.country ?? '',
          lat: latitude,
          lon: longitude,
        }
        _setLocation(next)
        try {
          localStorage.setItem(STORAGE_KEYS.lastLocation, JSON.stringify(next))
        } catch {
          /* storage unavailable */
        }
        setGeoStatus('ok')
      },
      () => {
        setGeoStatus('denied')
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false },
    )
  }, [])

  const setLocation = useCallback((place) => {
    if (!isPlace(place)) return
    const next = { name: place.name ?? 'Selected location', ...place }
    _setLocation(next)
    setGeoStatus('manual')
    try {
      localStorage.setItem(STORAGE_KEYS.lastLocation, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
  }, [])

  const setUnits = useCallback((u) => {
    _setUnits(u)
    try {
      localStorage.setItem(STORAGE_KEYS.units, u)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const toggleTheme = useCallback(() => {
    _setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEYS.theme, next)
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      location,
      setLocation,
      units,
      setUnits,
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      geoStatus,
    }),
    [location, setLocation, units, setUnits, theme, toggleTheme, geoStatus],
  )

  return createElement(AppContext.Provider, { value }, children)
}