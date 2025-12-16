/**
 * API Error Handling Utility
 * Comprehensive error handling for network requests
 */

import { logger } from './logger'

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiError {
  type: ErrorType
  statusCode?: number
  message: string
  details?: unknown
  originalError?: Error
}

/**
 * Map HTTP status code to ErrorType
 */
function getErrorTypeFromStatusCode(statusCode: number): ErrorType {
  if (statusCode === 401) return ErrorType.UNAUTHORIZED
  if (statusCode === 403) return ErrorType.FORBIDDEN
  if (statusCode === 404) return ErrorType.NOT_FOUND
  if (statusCode >= 400 && statusCode < 500) return ErrorType.VALIDATION_ERROR
  if (statusCode >= 500) return ErrorType.SERVER_ERROR
  return ErrorType.UNKNOWN_ERROR
}

/**
 * Create a user-friendly error message
 */
function getUserFriendlyMessage(error: ApiError): string {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection.'
    case ErrorType.TIMEOUT_ERROR:
      return 'Request timed out. Please try again.'
    case ErrorType.UNAUTHORIZED:
      return 'Please log in to continue.'
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to access this resource.'
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.'
    case ErrorType.VALIDATION_ERROR:
      return `Request validation failed: ${error.message}`
    case ErrorType.SERVER_ERROR:
      return 'Server error occurred. Please try again later.'
    default:
      return error.message || 'An unknown error occurred.'
  }
}

/**
 * Handle GraphQL errors
 */
export function handleGraphQLError(response: any): ApiError {
  const errors = response?.errors || []
  const firstError = errors[0]

  const message = firstError?.message || 'GraphQL request failed'
  const type = message.includes('Unauthorized')
    ? ErrorType.UNAUTHORIZED
    : message.includes('not found')
      ? ErrorType.NOT_FOUND
      : ErrorType.SERVER_ERROR

  return {
    type,
    message,
    details: errors,
  }
}

/**
 * Handle fetch API errors
 */
export async function handleFetchError(response: Response): Promise<ApiError> {
  const statusCode = response.status
  const type = getErrorTypeFromStatusCode(statusCode)

  let message = `HTTP ${statusCode}: ${response.statusText}`
  let details: unknown

  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      details = await response.json()
      if (typeof details === 'object' && details !== null) {
        if ('message' in details) {
          message = (details as any).message
        }
      }
    } else {
      details = await response.text()
    }
  } catch (error) {
    logger.debug('Could not parse error response body', error)
  }

  return {
    type,
    statusCode,
    message,
    details,
  }
}

/**
 * Handle network errors (connection failures, timeouts, etc)
 */
export function handleNetworkError(error: Error): ApiError {
  const isTimeout =
    error.name === 'AbortError' || error.message.includes('timeout')
  const isNetworkError =
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('Network request failed')

  const type = isTimeout ? ErrorType.TIMEOUT_ERROR : ErrorType.NETWORK_ERROR
  const message = isTimeout
    ? 'Request timed out'
    : isNetworkError
      ? 'Network connection failed'
      : error.message

  return {
    type,
    message,
    originalError: error,
  }
}

/**
 * Wrap a fetch request with error handling
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<{ data: T | null; error: ApiError | null }> {
  const timeout = options?.timeout || 30000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    logger.logRequest('GET', url)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await handleFetchError(response)
      logger.logNetworkError('GET', url, new Error(error.message), error.details)
      return { data: null, error }
    }

    const data = (await response.json()) as T
    logger.logResponse('GET', url, response.status, data)
    return { data, error: null }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error) {
      const apiError = handleNetworkError(error)
      logger.logNetworkError('GET', url, error)
      return { data: null, error: apiError }
    }

    const unknownError: ApiError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      originalError: error as Error,
    }
    logger.error('Unknown error during fetch', error as Error)
    return { data: null, error: unknownError }
  }
}

/**
 * Retry a failed request with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const delay = initialDelay * Math.pow(2, attempt)
      logger.warn(
        `Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
        { error: lastError.message }
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Validate API response structure
 */
export function validateApiResponse(data: unknown, schema?: Record<string, any>): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  if (schema) {
    for (const key in schema) {
      if (!(key in (data as Record<string, any>))) {
        logger.warn(`Missing required field in response: ${key}`)
        return false
      }
    }
  }

  return true
}

/**
 * Create error boundary context
 */
export class ErrorBoundary {
  private errors: ApiError[] = []

  capture(error: ApiError): void {
    this.errors.push(error)
    logger.error(getUserFriendlyMessage(error), undefined, error)
  }

  getErrors(): ApiError[] {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  hasErrors(): boolean {
    return this.errors.length > 0
  }

  getLastError(): ApiError | null {
    return this.errors[this.errors.length - 1] || null
  }
}

// Export singleton error boundary
export const errorBoundary = new ErrorBoundary()
