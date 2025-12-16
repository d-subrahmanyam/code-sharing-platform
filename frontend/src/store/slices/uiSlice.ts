/**
 * UI Reducer
 * Manages UI state including notifications and theme preferences
 */
import { SHOW_NOTIFICATION, HIDE_NOTIFICATION } from '../actionTypes'
import type { UIState } from '../../types/redux'
import { generateId } from '@utils/helpers'

const initialState: UIState = {
  notifications: [],
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
}

/**
 * UI reducer function
 */
export default function uiReducer(
  state: UIState = initialState,
  action: any
): UIState {
  switch (action.type) {
    case SHOW_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: generateId(),
            ...action.payload,
          },
        ],
      }

    case HIDE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      }

    default:
      return state
  }
}
