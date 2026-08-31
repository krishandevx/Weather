export async function fetchAlerts() {
  // OpenWeatherMap's free 2.5 tier has no alert feed.
  // Wire a provider here (e.g. OWM OneCall 3.0 `alerts`, or a local met-agency feed)
  // returning [ { event, severity, start, end, description } ]. UI renders only real alerts.
  return []
}