/**
 * Comment Reducer
 * Manages code snippet comments state
 */
import {
  COMMENT_FETCH_REQUEST,
  COMMENT_FETCH_SUCCESS,
  COMMENT_FETCH_FAILURE,
  COMMENT_CREATE_REQUEST,
  COMMENT_CREATE_SUCCESS,
  COMMENT_CREATE_FAILURE,
} from '../actionTypes'
import { CommentState } from '@types/redux'

const initialState: CommentState = {
  items: [],
  loading: false,
  error: null,
}

/**
 * Comment reducer function
 */
export default function commentReducer(
  state: CommentState = initialState,
  action: any
): CommentState {
  switch (action.type) {
    case COMMENT_FETCH_REQUEST:
    case COMMENT_CREATE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case COMMENT_FETCH_SUCCESS:
      return {
        ...state,
        items: action.payload,
        loading: false,
      }

    case COMMENT_CREATE_SUCCESS:
      return {
        ...state,
        items: [...state.items, action.payload],
        loading: false,
      }

    case COMMENT_FETCH_FAILURE:
    case COMMENT_CREATE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      }

    default:
      return state
  }
}
