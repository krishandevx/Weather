# Atmos — Weather Intelligence

A premium weather dashboard built with React + Vite. Live conditions, rich forecasts,
air quality, an interactive radar map, multi-city comparison, and rule-based insights —
all wrapped in a polished custom design system with light/dark themes and motion.

## Features

- **Current conditions** — temperature, feels-like, humidity, dew point, wind + gusts,
  direction, pressure, visibility, cloud cover, and an estimated UV index
- **Hourly & daily forecasts** — next 24h strip and 5-day outlook with rain chance
- **Temperature trend chart** — custom SVG Catmull-Rom plot with hover tooltip and a
  "now" marker
- **Air quality** — gauge + pollutant breakdown (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- **Interactive map** — Leaflet + OSM tiles with a live precipitation radar overlay
  (RainViewer) and a configurable base/radar layer toggle
- **Sun & daylight** — sunrise/sunset arc, day length, and a pulse marker for daytime
- **Favorites** — pin cities; stored in `localStorage`, live chips with per-city temps
- **Recent searches** — autocomplete history, stored in `localStorage`
- **City comparison** — compare current vs. up to 3 more cities
- **Weather insights** — deterministic, explained rule engine (rain onset, wind trend,
  feels-like, dew point, UV, dry windows)
- **Activity outlook** — suitability scores for running, cycling, outdoor plans,
  travel, and photography with human-readable reasons
- **Geolocation** — "use my location" with clear error handling
- **Dynamic weather scenes** — condition-aware background (sun/moon glow, drifting
  clouds, storm flashes, star field, canvas rain/snow) that respects
  `prefers-reduced-motion`
- **Units** — °C/°F toggle; **themes** — light/dark, both persisted

## Tech stack

| Layer      | Choice                                          |
| ---------- | ----------------------------------------------- |
| App        | React 18, Vite 5, JSX                           |
| Data       | TanStack Query v5 (caching, retries, refetch)   |
| Motion     | framer-motion (reduced-motion aware)            |
| Maps       | Leaflet, OpenStreetMap, RainViewer radar tiles  |
| Icons      | lucide-react                                    |
| Styling    | CSS Modules + design tokens (`src/index.css`)   |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file and add an OpenWeatherMap API key
   ([free signup](https://openweathermap.org/api)):

   ```bash
   cp .env.example .env.local
   # edit .env.local → VITE_OPENWEATHER_API_KEY=your_key_here
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:5173 — the default city is **Delhi (IN)**.

## Scripts

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `npm run dev`        | Vite dev server with HMR          |
| `npm run build`      | Production build to `dist/`       |
| `npm run preview`    | Preview the production build      |
| `npm run lint`       | ESLint (`--max-warnings 0`)       |

## Data sources & honest limitations

- **OpenWeatherMap 2.5** — current weather, 5-day/3-hour forecast (incl. rain chance
  and dew point), air pollution, and forward/reverse geocoding.
- **RainViewer** — free public radar tiles served over OpenStreetMap.
- **Alerts**: the free tier exposes no alert feed. `src/services/alerts.js` returns an
  empty list — wire a provider (e.g. OWM OneCall 3.0) there and real alerts render.
- **History**: requires the paid History tier. `src/services/history.js` is scaffolded
  with a clearly-labelled empty state.
- **UV index** is a deterministic estimate derived from solar elevation, cloud cover,
  and time-of-day — labelled "est." in the UI.
- **Air quality** is available for many locations but not all; unsupported places get
  an honest empty state.

## Architecture

```
src/
├─ api/          HTTP client (typed errors) + OpenWeatherMap endpoints
├─ components/
│  ├─ air-quality/   AQI gauge & pollutant card
│  ├─ comparison/    city comparison table
│  ├─ environment/   animated weather scene (canvas particles, sky layers)
│  ├─ favorites/     favorite city chips
│  ├─ layout/        header, logo, Dashboard orchestration
│  ├─ maps/          Leaflet map + radar overlay
│  ├─ search/        city autocomplete (recents + favorites)
│  ├─ ui/            GlassCard, Skeleton, ErrorState, EmptyState, Reveal, AnimatedNumber
│  └─ weather/       hero, metrics, hourly/daily, chart, sun, insights, activities,
│                    alerts, history
├─ config/       constants (endpoints, defaults, keys) + env access
├─ hooks/        react-query wrappers, geolocation, local lists, ticking clock
├─ lib/          formatting, geometry, psychrometrics, motion presets
├─ services/     normalizers + rule engines (insights, activities, aqi, summaries)
├─ state/        app context (location, units, theme) with persistence
├─ App.jsx       provider + Dashboard shell
└─ index.css     design tokens (light/dark themes, motion, primitives)
```

## Notes

- Data is always fetched in metric and converted for display — the °C/°F toggle never
  refetches.
- Favorites, recents, theme, and unit preferences persist across sessions.
- The API key lives in `.env.local` (git-ignored). The original key was historically
  committed — **rotate it** if this repository is shared.