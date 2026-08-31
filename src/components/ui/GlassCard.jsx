import styles from './primitives.module.css'

export default function GlassCard({ title, icon: Icon, action, children, className = '', hover = false, as }) {
  const Tag = as ?? 'section'
  return (
    <Tag
      className={`${styles.glassCard} ${hover ? styles.hover : ''} ${className}`}
      aria-label={title || undefined}
    >
      {title && (
        <header className={styles.header}>
          <h2 className={styles.title}>
            {Icon && <Icon size={14} strokeWidth={2.2} className={styles.titleIcon} aria-hidden />}
            {title}
          </h2>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </Tag>
  )
}