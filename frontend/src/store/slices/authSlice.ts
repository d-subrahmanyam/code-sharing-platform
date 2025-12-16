/**
 * Auth Reducer
 * Manages authentication state including user login, registration, and token
 */
import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_LOGOUT,
  AUTH_REGISTER_REQUEST,
  AUTH_REGISTER_SUCCESS,
  AUTH_REGISTER_FAILURE,
} from '../actionTypes'
import { AuthState, User } from '@types/redux'

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem('authToken'),
  user: null,
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
      localStorage.setItem('authToken', action.payload.token)
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }

    case AUTH_LOGIN_FAILURE:
    case AUTH_REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    case AUTH_LOGOUT:
      localStorage.removeItem('authToken')
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
