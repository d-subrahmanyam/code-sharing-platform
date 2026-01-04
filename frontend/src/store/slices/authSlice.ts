/**
 * Auth Reducer
 * Manages authentication state including user login, registration, token verification, and logout
 */
import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_LOGOUT,
  AUTH_REGISTER_REQUEST,
  AUTH_REGISTER_SUCCESS,
  AUTH_REGISTER_FAILURE,
  AUTH_VERIFY_REQUEST,
  AUTH_VERIFY_SUCCESS,
  AUTH_VERIFY_FAILURE,
} from '../actionTypes'
import type { AuthState } from '../../types/redux'

// Helper to get user from localStorage
const getStoredUser = () => {
  try {
    const userJson = localStorage.getItem('authUser')
    return userJson ? JSON.parse(userJson) : null
  } catch (e) {
    console.warn('Failed to parse stored user:', e)
    return null
  }
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('authToken'),
  user: getStoredUser(),
  token: localStorage.getItem('authToken'),
  loading: false,
  error: null,
}

/**
 * Auth reducer function
 */
export default function authReducer(
  state: AuthState = initialState,
  action: any
): AuthState {
  console.log('📝 authReducer action:', action.type)
  console.log('📦 authReducer payload:', action.payload)
  
  switch (action.type) {
    case AUTH_LOGIN_REQUEST:
    case AUTH_REGISTER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case AUTH_LOGIN_SUCCESS:
    case AUTH_REGISTER_SUCCESS:
      console.log('✅ AUTH_LOGIN_SUCCESS received in reducer')
      console.log('   Payload:', action.payload)
      console.log('   Payload.user:', action.payload?.user)
      console.log('   Payload.token:', action.payload?.token)
      
      localStorage.setItem('authToken', action.payload.token)
      localStorage.setItem('authUser', JSON.stringify(action.payload.user))
      const newState = {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
      console.log('   New state.user:', newState.user)
      console.log('   User stored in localStorage')
      return newState

    case AUTH_LOGIN_FAILURE:
    case AUTH_REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case AUTH_LOGOUT:
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      }

    default:
      return state
  }
}
