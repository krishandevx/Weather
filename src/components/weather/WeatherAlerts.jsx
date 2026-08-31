import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import EmptyState from '../ui/EmptyState'
import Skeleton from '../ui/Skeleton'
import { fetchAlerts } from '../../services/alerts'
import styles from './alerts.module.css'

const SEVERITY_ICON = { warning: AlertTriangle, extreme: ShieldAlert }

export default function WeatherAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ['weather', 'alerts'],
    queryFn: fetchAlerts,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

  if (isLoading) {
    return <Skeleton height="8rem" />
  }

  return (
    <div>
      {!data || data.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No active warnings"
          hint="Alerts appear here automatically when issued for this area."
        />
      ) : (
        <ul className={styles.list}>
          {data.map((a, i) => {
            const Icon = SEVERITY_ICON[a.severity] ?? AlertTriangle
            return (
              <li key={i} className={styles.alert}>
                <Icon size={18} className={styles.alertIcon} aria-hidden />
                <div className={styles.alertBody}>
                  <span className={styles.alertTitle}>{a.event}</span>
                  <span className={styles.alertDesc}>{a.description}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}