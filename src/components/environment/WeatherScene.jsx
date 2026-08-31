import { useEffect, useMemo, useRef, useState } from 'react'
import { conditionVisual } from '../../services/condition'
import { MAX_PARTICLES } from '../../config/constants'
import styles from './environment.module.css'

const STAR_BG = makeStarPattern(22, 0.35)

/** Deterministic pseudo-random star pattern (stable across renders). */
function makeStarPattern(t, seed) {
  let leaves = []
  for (let i = 0; i < t; i++) {
    const x = (hash(i * 7 + seed) % 1000) / 1000 * 260
    const y = (hash(i * 13 + seed) % 1000) / 1000 * 260
    const r = 0.8 + ((hash(i * 31 + seed) % 60) / 100)
    leaves.push(`radial-gradient(circle at ${x.toFixed(1)}px ${y.toFixed(1)}px, var(--text-1) ${r.toFixed(2)}px, transparent ${(r + 0.7).toFixed(2)}px)`)
  }
  return leaves.join(', ')
}

function hash(n) {
  let x = Math.sin(n) * 43758.5453
  return Math.floor((x - Math.floor(x)) * 100000)
}

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ParticleCanvas({ kind }) {
  const canvasRef = useRef(null)
  const activeRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !kind || prefersReduced()) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    let raf = 0
    let particles = init(kind)
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const onVisibility = () => {
      activeRef.current = !document.hidden
      if (!activeRef.current) cancelAnimationFrame(raf)
      else raf = requestAnimationFrame(step)
    }

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles.forEach((p) => {
        if (p.x > w) p.x = w * 0.1
        if (p.y > h) p.y = h * 0.1
      })
    }

    const step = () => {
      if (!activeRef.current) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.y += p.sy
        p.x += p.sx
        p.vy = (p.vy || 0) + p.acc
        p.y += p.vy
        if (p.y > h + 12) {
          p.y = -8
          p.x = Math.random() * w
        }
        if (p.x > w + 12) p.x = -4
        if (p.x < -12) p.x = w + 4
        drawParticle(ctx, p, kind)
      }
      raf = requestAnimationFrame(step)
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', resize)
    resize()
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
    }
  }, [kind])

  if (!kind) return null
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

function init(kind) {
  const count = kind === 'snow' ? Math.min(MAX_PARTICLES, 42) : Math.min(MAX_PARTICLES, 70)
  return Array.from({ length: count }, () => ({
    x: Math.random() * (typeof window === 'undefined' ? 1000 : window.innerWidth),
    y: Math.random() * (typeof window === 'undefined' ? 800 : window.innerHeight),
    sx: kind === 'snow' ? (Math.random() - 0.5) * 0.4 : -Math.random() * 1.2,
    sy: kind === 'snow' ? 0.6 + Math.random() * 0.7 : 4 + Math.random() * 3,
    acc: kind === 'snow' ? 0 : 0.06,
    len: kind === 'snow' ? 0 : 6 + Math.random() * 7,
    r: 0.8 + Math.random() * 1.6,
  }))
}

function drawParticle(ctx, p, kind) {
  if (kind === 'snow') {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fill()
  } else {
    ctx.strokeStyle = 'rgba(56,189,248,0.45)'
    ctx.lineWidth = 1.3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + p.len * 0.35, p.y + p.len)
    ctx.stroke()
  }
}

export default function WeatherScene({ current, isLoading }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const scene = useMemo(() => {
    if (!current?.condition?.icon) return null
    return conditionVisual(current.condition.icon)
  }, [current?.condition?.icon])

  if (!scene || isLoading || !mounted) return null
  const isDay = scene.isDay
  const cls = [styles.scene, isDay ? '' : styles.night].join(' ')
  const kind = scene.scene === 'rain' ? 'rain' : scene.scene === 'snow' ? 'snow' : null

  return (
    <div className={cls} aria-hidden="true">
      <div className={styles.veil} />
      {scene.scene === 'clear' && <div className={`${styles.celestial} ${isDay ? styles.sunDisk : styles.moonDisk}`} />}
      {(scene.scene === 'clouds' || scene.scene === 'rain' || scene.scene === 'snow' || scene.scene === 'fog' || scene.scene === 'storm') && (
        <>
          <div className={`${styles.cloud} ${styles.cloud1}`} />
          <div className={`${styles.cloud} ${styles.cloud2}`} />
          <div className={`${styles.cloud} ${styles.cloud3}`} />
        </>
      )}
      {scene.scene === 'storm' && <div className={styles.flash} />}
      {!isDay && <div className={styles.stars} style={{ backgroundImage: STAR_BG }} />}
      <ParticleCanvas kind={kind} />
    </div>
  )
}