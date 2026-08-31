import { REQUEST_TIMEOUT_MS } from '../config/constants'

export const ErrorCode = {
  NO_KEY: 'NO_KEY',
  INVALID_CITY: 'INVALID_CITY',
  INVALID_KEY: 'INVALID_KEY',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  NETWORK: 'NETWORK',
  SERVER: 'SERVER',
  MALFORMED: 'MALFORMED',
}

export class ApiError extends Error {
  constructor(code, message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/**
 * Thin fetch wrapper with timeout + normalized, typed errors.
 * Responses are decoded as JSON; the shape is left to callers.
 */
export async function fetchJson(url, { timeout = REQUEST_TIMEOUT_MS, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const onExternalAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onExternalAbort, { once: true })
  }

  let response
  try {
    response = await fetch(url, { signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted && !(signal && signal.aborted)) {
      throw new ApiError(ErrorCode.TIMEOUT, 'The request timed out.')
    }
    if (signal && signal.aborted) throw new ApiError(ErrorCode.NETWORK, 'Request cancelled.')
    throw new ApiError(ErrorCode.NETWORK, 'Network error — check your connection.')
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }

  if (!response.ok) {
    throw httpError(response.status)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(ErrorCode.MALFORMED, 'Unexpected response from the weather service.')
  }

  // OpenWeatherMap sometimes signals errors via `cod` in an otherwise 200 body.
  const cod = payload?.cod
  if (cod !== undefined && Number(cod) >= 400) {
    throw httpError(Number(cod), payload?.message)
  }

  return payload
}

function httpError(status, detail) {
  switch (status) {
    case 400:
      return new ApiError(ErrorCode.INVALID_CITY, 'Could not find that location.', status)
    case 401:
      return new ApiError(
        ErrorCode.INVALID_KEY,
        'The weather service rejected the API key.',
        status,
      )
    case 404:
      return new ApiError(ErrorCode.INVALID_CITY, "Couldn't find that location.", status)
    case 429:
      return new ApiError(ErrorCode.RATE_LIMIT, 'Too many requests — wait a moment and retry.', status)
    default:
      if (status >= 500) {
        return new ApiError(ErrorCode.SERVER, 'The weather service is unavailable right now.', status)
      }
      return new ApiError(ErrorCode.SERVER, detail || 'Something went wrong.', status)
  }
}

export function isApiError(err, code) {
  return err instanceof ApiError && err.code === code
}