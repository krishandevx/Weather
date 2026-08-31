import { History } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { HISTORY_REASON, HISTORY_UNAVAILABLE } from '../../services/history'

export default function WeatherHistory() {
  return (
    <div>
      {HISTORY_UNAVAILABLE ? (
        <EmptyState
          icon={History}
          title="Historical weather"
          hint={`${HISTORY_REASON} Connect a provider in services/history.js to enable trends.`}
        />
      ) : (
        <div>History view renders here.</div>
      )}
    </div>
  )
}