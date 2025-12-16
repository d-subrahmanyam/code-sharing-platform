/**
 * Snippet Saga
 * Handles code snippet side effects (fetch, create, update, delete)
 */
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  SNIPPET_FETCH_REQUEST,
  SNIPPET_FETCH_SUCCESS,
  SNIPPET_FETCH_FAILURE,
  SNIPPET_CREATE_REQUEST,
  SNIPPET_CREATE_SUCCESS,
  SNIPPET_CREATE_FAILURE,
  SNIPPET_UPDATE_REQUEST,
  SNIPPET_UPDATE_SUCCESS,
  SNIPPET_UPDATE_FAILURE,
  SNIPPET_DELETE_REQUEST,
  SNIPPET_DELETE_SUCCESS,
  SNIPPET_DELETE_FAILURE,
} from '../actionTypes'
import apiClient from '@api/client'

/**
 * Fetch snippets saga worker function
 */
function* fetchSnippetsSaga(action: any) {
  try {
    const response = yield call(apiClient.get, '/snippets')
    yield put({
      type: SNIPPET_FETCH_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_FETCH_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch snippets',
    })
  }
}

/**
 * Create snippet saga worker function
 */
function* createSnippetSaga(action: any) {
  try {
    const response = yield call(apiClient.post, '/snippets', action.payload)
    yield put({
      type: SNIPPET_CREATE_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_CREATE_FAILURE,
      payload: error.response?.data?.message || 'Failed to create snippet',
    })
  }
}

/**
 * Update snippet saga worker function
 */
function* updateSnippetSaga(action: any) {
  try {
    const { id, ...data } = action.payload
    const response = yield call(apiClient.put, `/snippets/${id}`, data)
    yield put({
      type: SNIPPET_UPDATE_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_UPDATE_FAILURE,
      payload: error.response?.data?.message || 'Failed to update snippet',
    })
  }
}

/**
 * Delete snippet saga worker function
 */
function* deleteSnippetSaga(action: any) {
  try {
    yield call(apiClient.delete, `/snippets/${action.payload}`)
    yield put({
      type: SNIPPET_DELETE_SUCCESS,
      payload: action.payload,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_DELETE_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete snippet',
    })
  }
}

/**
 * Snippet saga watcher
 */
export default function* snippetSaga() {
  yield takeEvery(SNIPPET_FETCH_REQUEST, fetchSnippetsSaga)
  yield takeEvery(SNIPPET_CREATE_REQUEST, createSnippetSaga)
  yield takeEvery(SNIPPET_UPDATE_REQUEST, updateSnippetSaga)
  yield takeEvery(SNIPPET_DELETE_REQUEST, deleteSnippetSaga)
}
