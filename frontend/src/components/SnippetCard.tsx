import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiCalendar, FiUser, FiCode, FiTag, FiArrowRight } from 'react-icons/fi'

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
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              <FiCode size={14} />
              {snippet.language}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <FiUser size={14} />
              {snippet.author?.username || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <FiCalendar size={14} />
              {new Date(snippet.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="ml-4 text-right">
          <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
            <FiEye size={20} />
            {snippet.views || 0}
          </div>
          <p className="text-xs text-gray-600">views</p>
        </div>
        <FiArrowRight size={20} className="ml-2 text-gray-400" />
      </div>
    )
  }

  // Grid variant (default)
  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col group"
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <h3 className="text-lg font-bold truncate group-hover:text-blue-100 transition-colors">{snippet.title}</h3>
        <p className="flex items-center gap-2 text-blue-100 text-sm mt-1">
          <FiUser size={14} />
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
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            <FiCode size={14} />
            {snippet.language}
          </span>
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <FiEye size={14} /> {snippet.views || 0}
          </span>
        </div>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {snippet.tags.slice(0, 3).map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                <FiTag size={12} />
                {tag}
              </span>
            ))}
            {snippet.tags.length > 3 && (
              <span className="text-xs text-gray-500 font-medium">+{snippet.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-1">
            <FiCalendar size={12} />
            {new Date(snippet.createdAt).toLocaleDateString()}
          </div>
          <FiArrowRight size={14} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  )
}

export default SnippetCard

