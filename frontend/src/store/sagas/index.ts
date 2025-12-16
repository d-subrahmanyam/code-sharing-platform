/**
 * Root Saga
 * Combines all sagas for the application
 */
import { all, fork } from 'redux-saga/effects'
import authSaga from './authSaga'
import snippetSaga from './snippetSaga'
import commentSaga from './commentSaga'

/**
 * Root saga that forks all other sagas
 */
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(snippetSaga),
    fork(commentSaga),
  ])
}
