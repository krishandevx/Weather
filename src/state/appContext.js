import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCATION, DEFAULT_UNITS, STORAGE_KEYS } from '../config/constants'

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

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setLocation = useCallback((place) => {
    if (!isPlace(place)) return
    const next = { name: place.name ?? 'Selected location', ...place }
    _setLocation(next)
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
    () => ({ location, setLocation, units, setUnits, theme, toggleTheme, isDark: theme === 'dark' }),
    [location, setLocation, units, setUnits, theme, toggleTheme],
  )

  return createElement(AppContext.Provider, { value }, children)
}