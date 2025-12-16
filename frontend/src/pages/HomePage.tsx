import React from 'react'

/**
 * Home Page Component
 * Displays the landing page with featured code snippets and search functionality
 */
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Code Sharing Platform</h1>
          <p className="text-lg text-gray-600 mt-2">Share and collaborate on code snippets in real-time</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-500">Home page content coming soon...</p>
        </div>
      </main>
    </div>
  )
}

export default HomePage
