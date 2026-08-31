import styles from './primitives.module.css'

export default function Skeleton({ width = '100%', height = '1em', circle = false, style = {} }) {
  return (
    <span
      className={styles.skeleton}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : undefined,
        display: circle ? 'inline-block' : 'block',
        ...style,
      }}
    />
  )
}