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
} from '../actionTypes'
import { SnippetState, CodeSnippet } from '@types/redux'

const initialState: SnippetState = {
  items: [],
  currentSnippet: null,
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
