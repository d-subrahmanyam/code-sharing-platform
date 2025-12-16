import React from 'react'
import { useNavigate } from 'react-router-dom'

interface Snippet {
  id: string
  title: string
  description?: string
  code?: string
  language: string
  author?: {
    id: string
    username: string
  }
  tags?: string[]
  views?: number
  createdAt: string
  updatedAt?: string
}

interface SnippetCardProps {
  snippet: Snippet
  variant?: 'grid' | 'list'
}

/**
 * Snippet Card Component
 * Reusable card for displaying snippet information
 */
const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, variant = 'grid' }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/editor/${snippet.id}`)
  }

  if (variant === 'list') {
    return (
      <div
        onClick={handleClick}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
      >
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{snippet.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{snippet.description || 'No description'}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {snippet.language}
            </span>
            <span className="text-xs text-gray-500">
              {snippet.author?.username || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(snippet.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="ml-4 text-right">
          <p className="text-2xl font-bold text-gray-900">{snippet.views || 0}</p>
          <p className="text-xs text-gray-600">views</p>
        </div>
      </div>
    )
  }

  // Grid variant (default)
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <h3 className="text-lg font-bold truncate">{snippet.title}</h3>
        <p className="text-blue-100 text-sm mt-1">
          {snippet.author?.username || 'Anonymous'}
        </p>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {snippet.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
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
            {snippet.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
            {snippet.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{snippet.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-500 pt-3 border-t border-gray-200 mt-auto">
          {new Date(snippet.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default SnippetCard
