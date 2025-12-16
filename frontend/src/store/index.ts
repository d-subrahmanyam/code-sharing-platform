/**
 * Redux Store Configuration
 * Sets up the Redux store with reducers and middleware
 */
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import authReducer from './slices/authSlice'
import snippetReducer from './slices/snippetSlice'
import commentReducer from './slices/commentSlice'
import uiReducer from './slices/uiSlice'
import rootSaga from './sagas'

// Create saga middleware
const sagaMiddleware = createSagaMiddleware()

/**
 * Configure the Redux store
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    snippet: snippetReducer,
    comment: commentReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sagaMiddleware),
})

// Run the root saga
sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
