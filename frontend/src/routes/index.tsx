import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import EditorPage from '../pages/EditorPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'

/**
 * Application Routes
 * Defines all routes and lazy-loaded pages
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: '/editor/:snippetId',
    element: <EditorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

/**
 * Routes Component
 * Provides router to the application
 */
export const Routes: React.FC = () => {
  return <RouterProvider router={router} />
}

export default Routes
