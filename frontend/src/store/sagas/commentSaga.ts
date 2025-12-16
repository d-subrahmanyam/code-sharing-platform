/**
 * Comment Saga
 * Handles comment side effects (fetch, create, delete)
 */
import { call, put, takeEvery } from 'redux-saga/effects'
import {
  COMMENT_FETCH_REQUEST,
  COMMENT_FETCH_SUCCESS,
  COMMENT_FETCH_FAILURE,
  COMMENT_CREATE_REQUEST,
  COMMENT_CREATE_SUCCESS,
  COMMENT_CREATE_FAILURE,
  COMMENT_DELETE_REQUEST,
  COMMENT_DELETE_SUCCESS,
  COMMENT_DELETE_FAILURE,
} from '../actionTypes'
import { graphqlQuery } from '@api/client'

const FETCH_COMMENTS_QUERY = `
  query FetchComments($snippetId: String!) {
    comments(snippetId: $snippetId) {
      id
      snippetId
      authorId
      authorUsername
      content
      createdAt
      updatedAt
    }
  }
`

const CREATE_COMMENT_MUTATION = `
  mutation AddComment($snippetId: String!, $content: String!) {
    addComment(snippetId: $snippetId, content: $content) {
      id
      snippetId
      authorId
      authorUsername
      content
      createdAt
      updatedAt
    }
  }
`

const DELETE_COMMENT_MUTATION = `
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`

/**
 * Fetch comments saga worker function
 */
function* fetchCommentsSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      FETCH_COMMENTS_QUERY,
      { snippetId: action.payload }
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    yield put({
      type: COMMENT_FETCH_SUCCESS,
      payload: response.data.comments,
    })
  } catch (error: any) {
    yield put({
      type: COMMENT_FETCH_FAILURE,
      payload: error.message || 'Failed to fetch comments',
    })
  }
}

/**
 * Create comment saga worker function
 */
function* createCommentSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      CREATE_COMMENT_MUTATION,
      action.payload
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    yield put({
      type: COMMENT_CREATE_SUCCESS,
      payload: response.data.addComment,
    })
  } catch (error: any) {
    yield put({
      type: COMMENT_CREATE_FAILURE,
      payload: error.message || 'Failed to create comment',
    })
  }
}

/**
 * Delete comment saga worker function
 */
function* deleteCommentSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      DELETE_COMMENT_MUTATION,
      { id: action.payload }
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    if (response.data.deleteComment) {
      yield put({
        type: COMMENT_DELETE_SUCCESS,
        payload: action.payload,
      })
    } else {
      throw new Error('Failed to delete comment')
    }
  } catch (error: any) {
    yield put({
      type: COMMENT_DELETE_FAILURE,
      payload: error.message || 'Failed to delete comment',
    })
  }
}

/**
 * Comment saga watcher
 */
export default function* commentSaga() {
  yield takeEvery(COMMENT_FETCH_REQUEST, fetchCommentsSaga)
  yield takeEvery(COMMENT_CREATE_REQUEST, createCommentSaga)
  yield takeEvery(COMMENT_DELETE_REQUEST, deleteCommentSaga)
}
