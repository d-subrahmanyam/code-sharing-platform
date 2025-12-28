/**
 * Snippet Reducer
 * Manages code snippet state including fetching, creating, updating, and deleting snippets
 */
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
  SNIPPET_SET_TITLE_FROM_OWNER,
  JOINEE_SESSION_LOAD_REQUEST,
  JOINEE_SESSION_LOAD_SUCCESS,
  JOINEE_SESSION_LOAD_FAILURE,
  JOINEE_SESSION_CLEAR,
} from '../actionTypes'
import type { SnippetState } from '../../types/redux'

const initialState: SnippetState = {
  items: [],
  currentSnippet: null,
  joineeSession: {
    isLoading: false,
    error: null,
    ownerId: null,
    ownerUsername: null,
    title: null,
    code: null,
    language: null,
    tags: [],
    description: null,
  },
  loading: false,
  error: null,
}

/**
 * Snippet reducer function
 */
export default function snippetReducer(
  state: SnippetState = initialState,
  action: any
): SnippetState {
  switch (action.type) {
    case SNIPPET_FETCH_REQUEST:
    case SNIPPET_CREATE_REQUEST:
    case SNIPPET_UPDATE_REQUEST:
    case SNIPPET_DELETE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case SNIPPET_FETCH_SUCCESS:
      return {
        ...state,
        items: action.payload,
        loading: false,
      }

    case SNIPPET_CREATE_SUCCESS:
      return {
        ...state,
        items: [...state.items, action.payload],
        currentSnippet: action.payload,
        loading: false,
      }

    case SNIPPET_UPDATE_SUCCESS:
      return {
        ...state,
        items: state.items.map((snippet) =>
          snippet.id === action.payload.id ? action.payload : snippet
        ),
        currentSnippet: action.payload,
        loading: false,
      }

    case SNIPPET_DELETE_SUCCESS:
      return {
        ...state,
        items: state.items.filter((snippet) => snippet.id !== action.payload),
        currentSnippet: null,
        loading: false,
      }

    case SNIPPET_SET_TITLE_FROM_OWNER:
      return {
        ...state,
        currentSnippet: state.currentSnippet
          ? {
              ...state.currentSnippet,
              title: action.payload.title,
            }
          : null,
        loading: false,
      }

    // Joinee session actions
    case JOINEE_SESSION_LOAD_REQUEST:
      return {
        ...state,
        joineeSession: {
          ...state.joineeSession,
          isLoading: true,
          error: null,
        },
      }

    case JOINEE_SESSION_LOAD_SUCCESS:
      return {
        ...state,
        joineeSession: {
          isLoading: action.payload.isNewSnippetSession ? false : false,
          error: null,
          ownerId: action.payload.ownerId || null,
          ownerUsername: action.payload.ownerUsername || null,
          title: action.payload.title || null,
          code: action.payload.code || null,
          language: action.payload.language || null,
          tags: action.payload.tags || [],
          description: action.payload.description || null,
        },
      }

    case JOINEE_SESSION_LOAD_FAILURE:
      return {
        ...state,
        joineeSession: {
          ...state.joineeSession,
          isLoading: false,
          error: action.payload,
        },
      }

    case JOINEE_SESSION_CLEAR:
      return {
        ...state,
        joineeSession: {
          isLoading: false,
          error: null,
          ownerId: null,
          ownerUsername: null,
          title: null,
          code: null,
          language: null,
          tags: [],
          description: null,
        },
      }

    case SNIPPET_FETCH_FAILURE:
    case SNIPPET_CREATE_FAILURE:
    case SNIPPET_UPDATE_FAILURE:
    case SNIPPET_DELETE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    default:
      return state
  }
}
