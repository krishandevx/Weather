import styles from './primitives.module.css'

export default function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>
        {Icon && <Icon aria-hidden size={26} strokeWidth={1.8} />}
      </span>
      {title && <p className={styles.stateTitle}>{title}</p>}
      {hint && <p className={styles.stateHint}>{hint}</p>}
    </div>
  )
}