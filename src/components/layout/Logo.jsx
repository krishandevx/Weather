export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Atmos logo">
      <defs>
        <linearGradient id="atmos-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#atmos-g)" />
      <circle cx="32" cy="25" r="8.5" fill="#fff" opacity="0.96" />
      <path d="M17 41h30" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" opacity="0.85" />
      <path d="M22 49h20" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}