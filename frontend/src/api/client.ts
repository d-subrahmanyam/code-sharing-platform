/**
 * Axios API Client Configuration
 * Configures the HTTP client with interceptors for authentication, logging, and error handling
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import store from '../store'
import { logger } from '../utils/logger'
import { handleFetchError, errorBoundary } from '../utils/apiErrorHandler'

const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:8080/api'
const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`

/**
 * Create and configure the Axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

/**
 * Request interceptor to add JWT token to headers and log requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log the request
    logger.logRequest(config.method?.toUpperCase() || 'REQUEST', config.url || '', {
      headers: config.headers,
      data: config.data,
    })

    return config
  },
  (error: AxiosError) => {
    logger.error('Request interceptor error', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor to handle authentication errors and log responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    logger.logResponse(
      response.config.method?.toUpperCase() || 'REQUEST',
      response.config.url || '',
      response.status,
      response.data
    )
    return response
  },
  (error: AxiosError) => {
    // Log error response
    if (error.response) {
      logger.error(
        `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error,
        {
          status: error.response.status,
          data: error.response.data,
        }
      )

      // Handle unauthorized error - redirect to login
      if (error.response.status === 401) {
        logger.warn('Unauthorized access - redirecting to login')
        errorBoundary.capture({
          type: 'UNAUTHORIZED' as any,
          statusCode: 401,
          message: 'Session expired. Please log in again.',
        })
        window.location.href = '/login'
      }
    } else if (error.request) {
      logger.error('No response received from server', error)
    } else {
      logger.error('Error setting up the request', error)
    }

    return Promise.reject(error)
  }
)

/**
 * GraphQL query function
 */
export const graphqlQuery = async (query: string, variables?: Record<string, any>) => {
  try {
    const response = await apiClient.post(GRAPHQL_ENDPOINT, {
      query,
      variables,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

export default apiClient

