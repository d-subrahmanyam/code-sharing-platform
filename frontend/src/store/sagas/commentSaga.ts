/**
 * Comment Saga
 * Handles comment side effects (fetch, create)
 */
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  COMMENT_FETCH_REQUEST,
  COMMENT_FETCH_SUCCESS,
  COMMENT_FETCH_FAILURE,
  COMMENT_CREATE_REQUEST,
  COMMENT_CREATE_SUCCESS,
  COMMENT_CREATE_FAILURE,
} from '../actionTypes'
import apiClient from '@api/client'

/**
 * Fetch comments saga worker function
 */
function* fetchCommentsSaga(action: any) {
  try {
    const response = yield call(
      apiClient.get,
      `/snippets/${action.payload}/comments`
    )
    yield put({
      type: COMMENT_FETCH_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: COMMENT_FETCH_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch comments',
    })
  }
}

/**
 * Create comment saga worker function
 */
function* createCommentSaga(action: any) {
  try {
    const { snippetId, ...commentData } = action.payload
    const response = yield call(
      apiClient.post,
      `/snippets/${snippetId}/comments`,
      commentData
    )
    yield put({
      type: COMMENT_CREATE_SUCCESS,
      payload: response.data,
    })
  } catch (error: any) {
    yield put({
      type: COMMENT_CREATE_FAILURE,
      payload: error.response?.data?.message || 'Failed to create comment',
    })
  }
}

/**
 * Comment saga watcher
 */
export default function* commentSaga() {
  yield takeEvery(COMMENT_FETCH_REQUEST, fetchCommentsSaga)
  yield takeEvery(COMMENT_CREATE_REQUEST, createCommentSaga)
}
