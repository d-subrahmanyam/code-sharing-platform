/**
 * Auth Saga
 * Handles authentication side effects (login, registration, logout)
 */
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  AUTH_LOGIN_REQUEST,
  AUTH_LOGIN_SUCCESS,
  AUTH_LOGIN_FAILURE,
  AUTH_REGISTER_REQUEST,
  AUTH_REGISTER_SUCCESS,
  AUTH_REGISTER_FAILURE,
} from '../actionTypes'
import apiClient from '@api/client'
import type { LoginCredentials, RegisterCredentials } from '../../types/redux'

/**
 * Login saga worker function
 */
function* loginSaga(action: any) {
  try {
    const response = yield call(
      apiClient.post,
      '/auth/login',
      action.payload as LoginCredentials
    )
    yield put({
      type: AUTH_LOGIN_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: AUTH_LOGIN_FAILURE,
      payload: error.response?.data?.message || 'Login failed',
    })
  }
}

/**
 * Register saga worker function
 */
function* registerSaga(action: any) {
  try {
    const response = yield call(
      apiClient.post,
      '/auth/register',
      action.payload as RegisterCredentials
    )
    yield put({
      type: AUTH_REGISTER_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: AUTH_REGISTER_FAILURE,
      payload: error.response?.data?.message || 'Registration failed',
    })
  }
}

/**
 * Auth saga watcher
 */
export default function* authSaga() {
  yield takeEvery(AUTH_LOGIN_REQUEST, loginSaga)
  yield takeEvery(AUTH_REGISTER_REQUEST, registerSaga)
}
