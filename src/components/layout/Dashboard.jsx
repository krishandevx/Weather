import { lazy, Suspense, useMemo } from 'react'
import { Clock, Activity as ActivityIcon, Sparkles, Map as MapIcon, History as HistoryIcon, ShieldAlert, CalendarDays, LineChart } from 'lucide-react'
import Header from './Header'
import GlassCard from '../ui/GlassCard'
import ErrorState from '../ui/ErrorState'
import Reveal from '../ui/Reveal'
import Skeleton from '../ui/Skeleton'
import WeatherScene from '../environment/WeatherScene'
import WeatherHero from '../weather/WeatherHero'
import WeatherMetrics from '../weather/WeatherMetrics'
import HourlyForecast from '../weather/HourlyForecast'
import DailyForecast from '../weather/DailyForecast'
import TemperatureChart from '../weather/TemperatureChart'
import SunriseSunset from '../weather/SunriseSunset'
import AirQualityCard from '../air-quality/AirQualityCard'
import WeatherInsights from '../weather/WeatherInsights'
import ActivityRecommendations from '../weather/ActivityRecommendations'
import WeatherAlerts from '../weather/WeatherAlerts'
import WeatherHistory from '../weather/WeatherHistory'
import FavoriteCities from '../favorites/FavoriteCities'
import CityComparison from '../comparison/CityComparison'
import { useApp } from '../../state/appContext'
import { useWeather, useAirQuality } from '../../hooks/useWeather'
import { useNow } from '../../hooks/useNow'
import { generateInsights } from '../../services/insights'
import { evaluateActivities } from '../../services/activity'
import { estimateUvIndex } from '../../lib/geometry'
import { hasOpenWeatherKey } from '../../config/env'
import styles from './dashboard.module.css'

const WeatherMap = lazy(() => import('../maps/WeatherMap'))

export default function Dashboard() {
  const { location, units } = useApp()
  const weather = useWeather(location)
  const aq = useAirQuality(location)
  const now = useNow()

  const { current, hourly, daily, series, sun, timezoneOffset, isLoading, isError, error, refetch } =
    weather

  const uv = useMemo(
    () =>
      current
        ? estimateUvIndex({ nowSec: now.getTime() / 1000, sun, cloudCover: current.cloudCover })
        : null,
    [current, sun, now],
  )

  const insights = useMemo(
    () =>
      current
        ? generateInsights({
            current,
            hourly,
            daily,
            sun,
            timezoneOffset,
            nowSec: now.getTime() / 1000,
          })
        : [],
    [current, hourly, daily, sun, timezoneOffset, now],
  )

  const activities = useMemo(
    () =>
      current
        ? evaluateActivities({
            current,
            hourly,
            aqi: aq.air?.aqi ?? null,
            uv,
            sun,
            nowSec: now.getTime() / 1000,
          })
        : [],
    [current, hourly, aq.air, uv, sun, now],
  )

  return (
    <div className={styles.root}>
      <WeatherScene current={current} isLoading={isLoading} />

      <div className={styles.stack}>
        <Header />

        <div className="atmos-container">
          <div className={styles.stack}>
            {!hasOpenWeatherKey() && (
              <GlassCard>
                <ErrorState
                  title="Missing API key"
                  message="Set VITE_OPENWEATHER_API_KEY in .env.local to load live weather."
                  code="NO_KEY"
                />
              </GlassCard>
            )}

            {hasOpenWeatherKey() && isError && (
              <GlassCard className={styles.errorBanner}>
                <ErrorState
                  title="Couldn't load this location"
                  message={error?.message}
                  code={error?.code}
                  onRetry={refetch}
                />
              </GlassCard>
            )}

            <FavoriteCities />
            <Reveal>
              <WeatherHero current={current} timezoneOffset={timezoneOffset} isLoading={isLoading} />
            </Reveal>

            <Reveal delay={0.05}>
              <WeatherMetrics
                current={current}
                sun={sun}
                timezoneOffset={timezoneOffset}
                isLoading={isLoading}
              />
            </Reveal>
          </div>

          <div className={styles.stack}>
            <Reveal>
              <GlassCard title="Next 24 hours" icon={Clock}>
                <HourlyForecast
                  hourly={hourly}
                  current={current}
                  timezoneOffset={timezoneOffset}
                  units={units}
                  isLoading={isLoading}
                />
              </GlassCard>
            </Reveal>

            <Reveal>
              <GlassCard title="Temperature trend" icon={LineChart}>
                <TemperatureChart series={series} timezoneOffset={timezoneOffset} isLoading={isLoading} />
              </GlassCard>
            </Reveal>

            <div className={styles.twoCol}>
              <Reveal>
                <GlassCard title="Daily forecast" icon={CalendarDays}>
                  <DailyForecast daily={daily} units={units} isLoading={isLoading} />
                </GlassCard>
              </Reveal>
              <div className={styles.rail}>
                <Reveal delay={0.05}>
                  <GlassCard title="Sun & daylight" icon={Clock}>
                    <SunriseSunset sun={sun} timezoneOffset={timezoneOffset} isLoading={isLoading} />
                  </GlassCard>
                </Reveal>
                <Reveal delay={0.1}>
                  <GlassCard title="Air quality" icon={Sparkles}>
                    <AirQualityCard
                      air={aq.air}
                      isLoading={aq.isLoading}
                      isError={aq.isError}
                      error={aq.error}
                      onRetry={aq.refetch}
                    />
                  </GlassCard>
                </Reveal>
              </div>
            </div>
          </div>

          <div className={styles.stack}>
            <Reveal>
              <GlassCard title="Weather insights" icon={Sparkles}>
                <WeatherInsights insights={insights} isLoading={isLoading && current == null} />
              </GlassCard>
            </Reveal>

            <Reveal>
              <GlassCard title="Activity outlook" icon={ActivityIcon}>
                <ActivityRecommendations activities={activities} isLoading={isLoading && current == null} />
              </GlassCard>
            </Reveal>

            <Reveal>
              <Suspense fallback={<GlassCard title="Map" icon={MapIcon}><div><Skeleton height="20rem" /></div></GlassCard>}>
                <WeatherMap place={location} isLoading={isLoading} />
              </Suspense>
            </Reveal>

            <Reveal>
              <CityComparison />
            </Reveal>

            <div className={styles.twoCol}>
              <Reveal>
                <GlassCard title="Alerts & warnings" icon={ShieldAlert}>
                  <WeatherAlerts />
                </GlassCard>
              </Reveal>
              <Reveal delay={0.05}>
                <GlassCard title="Weather history" icon={HistoryIcon}>
                  <WeatherHistory />
                </GlassCard>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}