/**
 * Magnus formula — standard psychrometric dew-point estimate from temperature + relative humidity.
 */
export function dewPoint(tempCelsius, humidity) {
  if (tempCelsius == null || humidity == null) return null
  const a = 17.625
  const b = 243.04
  const gamma = Math.log(Math.max(1, Math.min(100, humidity)) / 100) + (a * tempCelsius) / (b + tempCelsius)
  return (b * gamma) / (a - gamma)
}