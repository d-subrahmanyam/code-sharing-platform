/**
 * Axios API Client Configuration
 * Configures the HTTP client with interceptors for authentication
 */
import axios, { AxiosInstance, AxiosError } from 'axios'
import store from '../store'

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
})

/**
 * Request interceptor to add JWT token to headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor to handle authentication errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error - redirect to login
      window.location.href = '/login'
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

