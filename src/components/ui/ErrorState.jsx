import { AlertTriangle } from 'lucide-react'
import styles from './primitives.module.css'

export default function ErrorState({ title = 'Something went wrong', message, code, onRetry }) {
  return (
    <div className={styles.state} role="alert">
      <span className={`${styles.stateIcon} ${styles.stateIconError}`}>
        <AlertTriangle aria-hidden size={26} strokeWidth={1.8} />
      </span>
      <p className={styles.stateTitle}>{title}</p>
      {message && <p className={styles.stateHint}>{message}</p>}
      {code && <span className={styles.stateCode}>{code}</span>}
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}