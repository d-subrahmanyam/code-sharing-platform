import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { SNIPPET_FETCH_REQUEST } from '../store/actionTypes'

/**
 * Home Page Component
 * Displays the landing page with featured code snippets and search functionality
 */
const HomePage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')

  // Get snippets from Redux store
  const snippets = useSelector((state: any) => state.snippet?.items || [])
  const loading = useSelector((state: any) => state.snippet?.loading || false)

  useEffect(() => {
    // Fetch snippets on component mount
    dispatch({
      type: SNIPPET_FETCH_REQUEST,
      payload: {},
    } as any)
  }, [dispatch])

  const languages = [
    'JavaScript',
    'Python',
    'Java',
    'C++',
    'TypeScript',
    'HTML',
    'CSS',
    'SQL',
  ]

  const filteredSnippets = snippets.filter((snippet: any) => {
    const matchesQuery =
      !searchQuery ||
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguage =
      !selectedLanguage || snippet.language === selectedLanguage

    return matchesQuery && matchesLanguage
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Code Sharing</h1>
            <p className="text-lg text-gray-600 mt-2">
              Share and collaborate on code snippets in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/editor/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + New Snippet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Snippets
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            {!loading && (
              <p className="text-sm text-gray-600 mt-4">
                Found {filteredSnippets.length} snippet
                {filteredSnippets.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin text-4xl">⟳</div>
              <p className="text-gray-600 mt-4">Loading snippets...</p>
            </div>
          </div>
        )}

        {/* Snippets Grid */}
        {!loading && filteredSnippets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnippets.map((snippet: any) => (
              <div
                key={snippet.id}
                onClick={() => navigate(`/editor/${snippet.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <h3 className="text-lg font-bold truncate">{snippet.title}</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    by {snippet.author?.username || 'Anonymous'}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {snippet.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {snippet.description}
                    </p>
                  )}

                  {/* Language Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {snippet.language}
                    </span>
                    <span className="text-gray-500 text-xs">
                      👁 {snippet.views || 0} views
                    </span>
                  </div>

                  {/* Tags */}
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {snippet.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {snippet.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{snippet.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                    {new Date(snippet.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg mb-4">No snippets found</p>
              <button
                onClick={() => navigate('/editor/new')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create the first one →
              </button>
            </div>
          )
        )}
      </main>
    </div>
  )
}

export default HomePage
