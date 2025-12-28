/**
 * Snippet Saga
 * Handles code snippet side effects (fetch, create, update, delete, joinee session)
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
  JOINEE_SESSION_LOAD_REQUEST,
  JOINEE_SESSION_LOAD_SUCCESS,
  JOINEE_SESSION_LOAD_FAILURE,
} from '../actionTypes'
import { graphqlQuery } from '@api/client'

const FETCH_SNIPPETS_QUERY = `
  query FetchSnippets($limit: Int, $offset: Int) {
    snippets(limit: $limit, offset: $offset) {
      id
      title
      description
      code
      language
      authorId
      authorUsername
      tags
      views
      isPublic
      shareUrl
      createdAt
      updatedAt
    }
  }
`

const CREATE_SNIPPET_MUTATION = `
  mutation CreateSnippet(
    $authorId: String!
    $title: String!
    $description: String!
    $code: String!
    $language: String!
    $tags: [String!]
    $isPublic: Boolean
  ) {
    createSnippet(
      authorId: $authorId
      title: $title
      description: $description
      code: $code
      language: $language
      tags: $tags
      isPublic: $isPublic
    ) {
      id
      title
      description
      code
      language
      authorId
      authorUsername
      tags
      views
      isPublic
      shareUrl
      createdAt
      updatedAt
    }
  }
`

const UPDATE_SNIPPET_MUTATION = `
  mutation UpdateSnippet(
    $id: String!
    $title: String!
    $description: String!
    $code: String!
    $language: String!
    $tags: [String!]
    $isPublic: Boolean
  ) {
    updateSnippet(
      id: $id
      title: $title
      description: $description
      code: $code
      language: $language
      tags: $tags
      isPublic: $isPublic
    ) {
      id
      title
      description
      code
      language
      authorId
      authorUsername
      tags
      views
      isPublic
      shareUrl
      createdAt
      updatedAt
    }
  }
`

const DELETE_SNIPPET_MUTATION = `
  mutation DeleteSnippet($id: String!) {
    deleteSnippet(id: $id)
  }
`

/**
 * Fetch snippets saga worker function
 */
function* fetchSnippetsSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      FETCH_SNIPPETS_QUERY,
      { limit: 20, offset: 0 }
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    yield put({
      type: SNIPPET_FETCH_SUCCESS,
      payload: response.data.snippets,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_FETCH_FAILURE,
      payload: error.message || 'Failed to fetch snippets',
    })
  }
}

/**
 * Create snippet saga worker function
 */
function* createSnippetSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      CREATE_SNIPPET_MUTATION,
      action.payload
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    yield put({
      type: SNIPPET_CREATE_SUCCESS,
      payload: response.data.createSnippet,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_CREATE_FAILURE,
      payload: error.message || 'Failed to create snippet',
    })
  }
}

/**
 * Update snippet saga worker function
 */
function* updateSnippetSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      UPDATE_SNIPPET_MUTATION,
      action.payload
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    yield put({
      type: SNIPPET_UPDATE_SUCCESS,
      payload: response.data.updateSnippet,
    })
  } catch (error: any) {
    yield put({
      type: SNIPPET_UPDATE_FAILURE,
      payload: error.message || 'Failed to update snippet',
    })
  }
}

/**
 * Delete snippet saga worker function
 */
function* deleteSnippetSaga(action: any) {
  try {
    const response = yield call(
      graphqlQuery,
      DELETE_SNIPPET_MUTATION,
      { id: action.payload }
    )
    
    if (response.errors) {
      throw new Error(response.errors[0].message)
    }

    if (response.data.deleteSnippet) {
      yield put({
        type: SNIPPET_DELETE_SUCCESS,
        payload: action.payload,
      })
    } else {
      throw new Error('Failed to delete snippet')
    }
  } catch (error: any) {
    yield put({
      type: SNIPPET_DELETE_FAILURE,
      payload: error.message || 'Failed to delete snippet',
    })
  }
}

/**
 * Load joinee session details saga worker function
 * Fetches owner and snippet details when a joinee joins a session
 * 
 * For "new-snippet-*" sessions: Skips API call since no backend entry exists yet.
 * Data will come via WebSocket from the owner.
 * For regular tiny codes: Calls API to load full snippet details.
 */
function* loadJoineeSessionSaga(action: any) {
  try {
    const { tinyCode } = action.payload
    
    console.log('[Saga] Loading joinee session details for tinyCode:', tinyCode)
    
    // Special handling for "new-snippet-*" format
    // These are temporary client-side codes for new snippets not yet in backend
    // Owner's WebSocket messages will provide the data instead
    if (tinyCode && tinyCode.startsWith('new-snippet-')) {
      console.log('[Saga] Detected new-snippet session - waiting for WebSocket data from owner')
      // Don't call API for new-snippet sessions - just dispatch success with minimal data
      // The actual snippet data will come via WebSocket collaboration messages
      yield put({
        type: JOINEE_SESSION_LOAD_SUCCESS,
        payload: {
          snippetId: tinyCode,
          tinyCode: tinyCode,
          isNewSnippetSession: true,
          waitingForOwnerData: true,
        },
      })
      return
    }
    
    // Call API to get owner and snippet details for real tiny codes
    const response = yield call(
      fetch,
      `/api/snippets/lookup/${tinyCode}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to load session details: ${response.statusText}`)
    }
    
    const data = yield call(() => response.json())
    
    console.log('[Saga] Loaded joinee session data:', data)
    
    yield put({
      type: JOINEE_SESSION_LOAD_SUCCESS,
      payload: data,
    })
  } catch (error: any) {
    console.error('[Saga] Error loading joinee session:', error)
    yield put({
      type: JOINEE_SESSION_LOAD_FAILURE,
      payload: error.message || 'Failed to load session details',
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
  yield takeEvery(JOINEE_SESSION_LOAD_REQUEST, loadJoineeSessionSaga)
}

