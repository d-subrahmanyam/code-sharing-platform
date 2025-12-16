import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { SNIPPET_FETCH_REQUEST, SNIPPET_CREATE_REQUEST, SNIPPET_UPDATE_REQUEST } from '../store/actionTypes'
import { FiCode, FiTag, FiLock, FiEye, FiTrash2, FiSave, FiX, FiChevronLeft, FiChevronRight, FiEyeOff } from 'react-icons/fi'
import Editor from 'react-simple-code-editor'
import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-go'
import 'prismjs/themes/prism-tomorrow.css'
import './EditorPage.css'

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
  const [showPreview, setShowPreview] = useState(false)
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
          {/* Toggle Button */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">
                {showPreview ? 'Preview' : 'Code Editor'}
              </span>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              title={showPreview ? 'Show code editor' : 'Show preview'}
            >
              {showPreview ? (
                <>
                  <FiCode size={18} />
                  Show Code
                </>
              ) : (
                <>
                  <FiEye size={18} />
                  Preview
                </>
              )}
            </button>
          </div>

          {/* Editor / Preview Content */}
          <div className="flex-1 overflow-hidden">
            {!showPreview ? (
              <div className="w-full h-full overflow-auto bg-gray-900">
                <Editor
                  value={formData.code}
                  onValueChange={(code) => setFormData(prev => ({ ...prev, code }))}
                  highlight={(code) => {
                    const languageMap: { [key: string]: string } = {
                      'javascript': 'javascript',
                      'python': 'python',
                      'java': 'java',
                      'cpp': 'cpp',
                      'typescript': 'typescript',
                      'html': 'markup',
                      'css': 'css',
                      'sql': 'sql',
                      'bash': 'bash',
                      'go': 'go',
                    }
                    const lang = languageMap[formData.language] || 'javascript'
                    try {
                      const Prism = (window as any).Prism
                      return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang)
                    } catch (error) {
                      return code
                    }
                  }}
                  padding={16}
                  textareaClassName="focus:outline-none"
                  className="!bg-gray-900 !text-gray-100 !font-mono !text-sm !leading-6"
                  style={{
                    fontFamily: '"Fira Code", "Courier New", monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                  placeholder="Paste your code here..."
                />
              </div>
            ) : (
              <div className="p-6 overflow-auto bg-gray-900">
                <div className="bg-gray-800 rounded-lg p-6 text-gray-100 font-mono text-sm whitespace-pre-wrap break-words border border-gray-700">
                  {formData.code || (
                    <span className="text-gray-500 italic">
                      Your code preview will appear here...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPage
