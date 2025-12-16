import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { SNIPPET_FETCH_REQUEST, SNIPPET_CREATE_REQUEST, SNIPPET_UPDATE_REQUEST } from '../store/actionTypes'
import { FiCode, FiTag, FiLock, FiEye, FiTrash2, FiSave, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

/**
 * Editor Page Component
 * Main editor interface for viewing and editing code snippets with real-time collaboration
 */
const EditorPage: React.FC = () => {
  const { snippetId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [isNew] = useState(snippetId === 'new')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'comments'>('code')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [] as string[],
    isPublic: true,
  })

  const [newTag, setNewTag] = useState('')
  const [currentUser] = useState(null) // In real app, get from Redux auth state

  const snippet = useSelector((state: any) =>
    isNew ? null : state.snippet?.items.find((s: any) => s.id === snippetId)
  )
  const comments = useSelector((state: any) => state.comment?.items || [])

  useEffect(() => {
    if (!isNew && snippetId) {
      dispatch({
        type: SNIPPET_FETCH_REQUEST,
        payload: { id: snippetId },
      } as any)
    }
  }, [snippetId, isNew, dispatch])

  useEffect(() => {
    if (snippet && !isNew) {
      setFormData({
        title: snippet.title || '',
        description: snippet.description || '',
        code: snippet.code || '',
        language: snippet.language || 'javascript',
        tags: snippet.tags || [],
        isPublic: snippet.isPublic !== false,
      })
    }
  }, [snippet, isNew])

  const languages = [
    'javascript',
    'python',
    'java',
    'cpp',
    'typescript',
    'html',
    'css',
    'sql',
    'bash',
    'go',
  ]

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!formData.code.trim()) {
      alert('Please enter some code')
      return
    }

    setIsSaving(true)

    try {
      if (isNew) {
        dispatch({
          type: SNIPPET_CREATE_REQUEST,
          payload: formData,
        } as any)
      } else {
        dispatch({
          type: SNIPPET_UPDATE_REQUEST,
          payload: {
            id: snippetId,
            ...formData,
          },
        } as any)
      }

      // Redirect after save (in real app, handle via saga)
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      alert('Failed to save snippet')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCode size={24} className="text-blue-400" />
            {isNew ? 'New Snippet' : formData.title || 'Untitled Snippet'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <FiSave size={18} />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Metadata */}
        <div className={`bg-gray-800 border-r border-gray-700 overflow-y-auto text-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}>
          {/* Collapse Toggle Button */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            {!sidebarCollapsed && <h2 className="text-sm font-semibold text-gray-300">Metadata</h2>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors ml-auto"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <FiChevronRight size={20} className="text-gray-400" />
              ) : (
                <FiChevronLeft size={20} className="text-gray-400" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          {!sidebarCollapsed && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Title */}
                <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                placeholder="Snippet title"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="What does this code do?"
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FiCode size={16} className="text-blue-400" />
                Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleFormChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FiTag size={16} className="text-blue-400" />
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    <FiTag size={12} />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-gray-200"
                    >
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="pt-4 border-t border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer hover:text-blue-400 transition-colors">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleFormChange}
                  className="rounded"
                />
                <span className="text-sm font-medium flex items-center gap-2">
                  {formData.isPublic ? (
                    <>
                      <FiEye size={16} className="text-blue-400" />
                      Public
                    </>
                  ) : (
                    <>
                      <FiLock size={16} className="text-yellow-400" />
                      Private
                    </>
                  )}
                </span>
              </label>
            </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {(['code', 'preview', 'comments'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'code' && (
              <textarea
                value={formData.code}
                onChange={handleFormChange}
                name="code"
                placeholder="Paste your code here..."
                className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm border-none outline-none resize-none"
              />
            )}

            {activeTab === 'preview' && (
              <div className="p-6 overflow-auto">
                <div className="bg-gray-800 rounded p-4 text-white font-mono text-sm whitespace-pre-wrap break-words">
                  {formData.code || 'Code preview will appear here...'}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="p-6 space-y-4 overflow-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map((comment: any) => (
                    <div
                      key={comment.id}
                      className="bg-gray-800 rounded p-4 text-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          {comment.author?.username || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  ))
                )}

                {currentUser && (
                  <div className="mt-6 bg-gray-800 rounded p-4">
                    <textarea
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                    <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Post Comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPage
