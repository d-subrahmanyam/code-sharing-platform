/**
 * Auth Saga
 * Handles authentication side effects (login, registration, logout, token verification)
 */
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_REGISTER_REQUEST,
  AUTH_REGISTER_SUCCESS,
  AUTH_REGISTER_FAILURE,
  AUTH_VERIFY_REQUEST,
  AUTH_VERIFY_SUCCESS,
  AUTH_VERIFY_FAILURE,
} from '../actionTypes'
import { graphqlQuery } from '@api/client'
import type { LoginCredentials, RegisterCredentials } from '../../types/redux'

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        role
      }
      success
      message
    }
  }
`

const REGISTER_MUTATION = `
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(username: $username, email: $email, password: $password) {
      token
      user {
        id
        username
        email
        role
      }
      success
      message
    }
  }
`

const VERIFY_TOKEN_QUERY = `
  query VerifyToken {
    verifyToken {
      user {
        id
        username
        email
        role
      }
      success
      message
    }
  }
`

/**
 * Login saga worker function
 */
function* loginSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      LOGIN_MUTATION,
      action.payload as LoginCredentials
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    const { data } = response
    
    if (data && data.login && data.login.success) {
      yield put({
        type: AUTH_LOGIN_SUCCESS,
        payload: data.login,
      })
    } else {
      yield put({
        type: AUTH_LOGIN_FAILURE,
        payload: data?.login?.message || 'Login failed',
      })
    }
  } catch (error: any) {
    yield put({
      type: AUTH_LOGIN_FAILURE,
      payload: error.message || 'Login failed',
    })
  }
}

/**
 * Register saga worker function
 */
function* registerSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      REGISTER_MUTATION,
      action.payload as RegisterCredentials
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    const { data } = response
    if (data.register.success) {
      yield put({
        type: AUTH_REGISTER_SUCCESS,
        payload: data.register,
      })
    } else {
      yield put({
        type: AUTH_REGISTER_FAILURE,
        payload: data.register.message || 'Registration failed',
      })
    }
  } catch (error: any) {
    yield put({
      type: AUTH_REGISTER_FAILURE,
      payload: error.message || 'Registration failed',
    })
  }
}

/**
 * Verify token saga worker function
 * Validates the stored auth token and restores user information
 */
function* verifySaga() {
  try {
    const response = yield call(graphqlQuery, VERIFY_TOKEN_QUERY, {})
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    const { data } = response
    if (data.verifyToken.success) {
      yield put({
        type: AUTH_VERIFY_SUCCESS,
        payload: {
          token: localStorage.getItem('authToken'),
          user: data.verifyToken.user,
          success: true,
        },
      })
    } else {
      yield put({
        type: AUTH_VERIFY_FAILURE,
        payload: data.verifyToken.message || 'Token verification failed',
      })
    }
  } catch (error: any) {
    yield put({
      type: AUTH_VERIFY_FAILURE,
      payload: error.message || 'Token verification failed',
    })
  }
}

/**
 * Root auth saga
 */
export default function* authSaga() {
  yield takeEvery(AUTH_LOGIN_REQUEST, loginSaga)
  yield takeEvery(AUTH_REGISTER_REQUEST, registerSaga)
  yield takeEvery(AUTH_VERIFY_REQUEST, verifySaga)
}

