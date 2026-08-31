import { useStorageList } from './useStorageList'
import { FAVORITES_LIMIT, RECENTS_LIMIT, STORAGE_KEYS } from '../config/constants'

export function useFavorites() {
  return useStorageList(STORAGE_KEYS.favorites, { limit: FAVORITES_LIMIT })
}

export function useRecentSearches() {
  return useStorageList(STORAGE_KEYS.recents, { limit: RECENTS_LIMIT })
}