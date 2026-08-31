import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../state/appContext'
import { formatTemp, formatTime } from '../../lib/format'
import { EASE, SPRING } from '../../lib/motion'
import Skeleton from '../ui/Skeleton'
import styles from './chart.module.css'

const H = 240
const PAD = { top: 18, right: 16, bottom: 28, left: 44 }

function smoothPath(pts) {
  if (pts.length === 0) return ''
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

export default function TemperatureChart({ series, timezoneOffset, isLoading }) {
  const { units } = useApp()
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [hoverIdx, setHoverIdx] = useState(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)))
    ro.observe(el)
    setWidth(Math.round(el.clientWidth))
    return () => ro.disconnect()
  }, [])

  const model = useMemo(
    () => (width > 0 && series.length >= 2 ? buildModel(series, width) : null),
    [series, width],
  )

  if (isLoading && series.length === 0) {
    return (
      <div aria-hidden>
        <Skeleton height="13rem" />
      </div>
    )
  }
  if (!model) {
    return (
      <div style={{ minHeight: '13rem' }} aria-hidden>
        <Skeleton height="13rem" />
      </div>
    )
  }
  if (series.length < 2) {
    return <div className={styles.empty}>Not enough forecast data to chart.</div>
  }

  const { pts, yTicks, xTicks, nowIdx, areaPath, linePath } = model
  const tip = hoverIdx != null ? pts[hoverIdx] : null

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverIdx(nearestIndex(pts, e.clientX - rect.left))
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label="Temperature trend over the next five days"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--info)" />
            <stop offset="0.5" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t.v}>
            <line
              x1={PAD.left}
              y1={t.y}
              x2={width - PAD.right}
              y2={t.y}
              className={styles.gridLine}
            />
            <text x={PAD.left - 8} y={t.y + 3.5} textAnchor="end" className={styles.axisLabel}>
              {formatTemp(t.v, units, { round: false })}
            </text>
          </g>
        ))}

        {xTicks.map((t) => (
          <text key={t.x} x={t.x} y={H - 8} textAnchor="middle" className={styles.axisLabel}>
            {formatTime(t.dt, timezoneOffset, { hour: 'numeric' })}
          </text>
        ))}

        <motion.path
          d={areaPath}
          fill="url(#chart-fill)"
          className={styles.area}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#chart-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />

        {nowIdx != null && (
          <g>
            <line
              x1={pts[nowIdx].x}
              y1={PAD.top}
              x2={pts[nowIdx].x}
              y2={pts[nowIdx].y}
              className={styles.nowLine}
            />
            <circle cx={pts[nowIdx].x} cy={pts[nowIdx].y} r={4.5} className={styles.nowDot} />
          </g>
        )}

        {tip && (
          <g>
            <line
              x1={tip.x}
              y1={PAD.top}
              x2={tip.x}
              y2={H - PAD.bottom}
              className={styles.crosshair}
            />
            <circle cx={tip.x} cy={tip.y} r={4} fill="var(--accent)" stroke="#fff" strokeWidth={1.5} />
          </g>
        )}
      </svg>

      {tip && (
        <motion.div
          className={styles.tooltip}
          animate={{ left: tip.x, top: tip.y }}
          transition={{ left: SPRING, top: SPRING }}
        >
          <span className={styles.tooltipTime}>
            {formatTime(tip.dt, timezoneOffset, { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className={styles.tooltipTemp}>{formatTemp(tip.temp, units)}</span>
        </motion.div>
      )}
    </div>
  )
}

function buildModel(series, width) {
  const w = Math.max(300, width)
  const temps = series.map((s) => s.temp).filter((t) => t != null)
  const rawMin = Math.min(...temps)
  const rawMax = Math.max(...temps)
  const pad = Math.max(1, (rawMax - rawMin) * 0.15)
  const yMin = rawMin - pad
  const yMax = rawMax + pad
  const innerW = w - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const pts = series.map((s, i) => ({
    dt: s.dt,
    temp: s.temp,
    x: PAD.left + (i * innerW) / Math.max(1, series.length - 1),
    y: PAD.top + (1 - (s.temp - yMin) / (yMax - yMin)) * innerH,
  }))

  const yTicks = Array.from({ length: 4 }, (_, i) => yMin + ((yMax - yMin) * i) / 3)
  const step = Math.max(1, Math.floor(series.length / 6))
  const xTicks = series
    .map((s, i) => ({ dt: s.dt, x: pts[i].x }))
    .filter((_, i) => i % step === 0 || i === series.length - 1)

  let nowIdx = null
  const nowMs = Date.now()
  for (let i = 0; i < series.length; i++) {
    if (series[i].dt * 1000 >= nowMs) {
      nowIdx = i
      break
    }
  }

  const linePath = smoothPath(pts)
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H - PAD.bottom} L ${pts[0].x},${H - PAD.bottom} Z`

  return { pts, yTicks, xTicks, nowIdx, linePath, areaPath }
}

function nearestIndex(pts, px) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < pts.length; i++) {
    const d = Math.abs(pts[i].x - px)
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}