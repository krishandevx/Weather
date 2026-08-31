import { useCallback, useEffect, useState } from 'react'

/**
 * Tiny module-level localStorage store with subscriber notification.
 * Keeps multiple components (header star, favorites strip, search) in sync.
 */

const stores = new Map()

function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function getStore(key) {
  let store = stores.get(key)
  if (!store) {
    store = { key, list: readList(key), listeners: new Set() }
    stores.set(key, store)
  }
  return store
}

function persist(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* quota / unavailable */
  }
}

function emit(store) {
  for (const fn of store.listeners) fn(store.list)
}

function updateList(key, mutator) {
  const store = getStore(key)
  const next = mutator(store.list)
  store.list = next
  persist(key, next)
  emit(store)
  return next
}

function samePlace(a, b) {
  return a && b && a.lat === b.lat && a.lon === b.lon
}

export function useStorageList(key, { limit = 20 } = {}) {
  const [list, setList] = useState(() => getStore(key).list)

  useEffect(() => {
    const store = getStore(key)
    const on = (next) => setList(next)
    store.listeners.add(on)
    setList(store.list)
    return () => store.listeners.delete(on)
  }, [key])

  const add = useCallback(
    (place) => {
      if (!place || typeof place.lat !== 'number' || typeof place.lon !== 'number') return
      updateList(key, (cur) => {
        const cleaned = cur.filter((p) => !samePlace(p, place))
        return [place, ...cleaned].slice(0, limit)
      })
    },
    [key, limit],
  )

  const removePlace = useCallback(
    (place) => {
      updateList(key, (cur) => cur.filter((p) => !samePlace(p, place)))
    },
    [key],
  )

  const clear = useCallback(() => updateList(key, () => []), [key])
  const has = useCallback((place) => (place ? list.some((p) => samePlace(p, place)) : false), [list])

  const toggle = useCallback(
    (place) => {
      if (has(place)) removePlace(place)
      else add(place)
    },
    [has, add, removePlace],
  )

  return { list, add, remove: removePlace, clear, has, toggle }
}