import React from 'react'

/**
 * Not Found Page Component
 * 404 error page for undefined routes
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-lg text-gray-600 mt-2">Page not found</p>
      </div>
    </div>
  )
}

export default NotFoundPage
