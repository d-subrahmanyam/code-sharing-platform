import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { SNIPPET_FETCH_REQUEST, SNIPPET_CREATE_REQUEST, SNIPPET_UPDATE_REQUEST } from '../store/actionTypes'
import { FiCode, FiTag, FiLock, FiEye, FiTrash2, FiSave, FiX, FiChevronLeft, FiChevronRight, FiEyeOff } from 'react-icons/fi'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { lookupSnippetByTinyCode, getTinyCodeMapping, storeTinyCodeMapping, isValidTinyCode, createSnippetShare, copyToClipboard } from '../utils/tinyUrl'
import { logger } from '../utils/logger'
import { UserJoinBubble } from '../components/UserJoinBubble'
import './EditorPage.css'

/**
 * Editor Page Component
 * Main editor interface for viewing and editing code snippets with real-time collaboration
 * Supports loading snippets from:
 * - Direct snippet ID: /editor/:snippetId
 * - Tiny/Shortened URL: /join/:tinyCode
 */
const EditorPage: React.FC = () => {
  const { snippetId: directSnippetId, tinyCode } = useParams<{ snippetId?: string; tinyCode?: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Debug logging
  console.log('EditorPage loaded', { directSnippetId, tinyCode })

  const [resolvedSnippetId, setResolvedSnippetId] = useState<string | null>(directSnippetId || null)
  const [isResolving, setIsResolving] = useState(false)
  const [resolutionError, setResolutionError] = useState<string | null>(null)
  const isNew = resolvedSnippetId === 'new' // Derive from current state, not initial state
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [shareableUrl, setShareableUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; username: string; timestamp: Date }>>([])
  const [userNotifications, setUserNotifications] = useState<Array<{ id: string; username: string; timestamp: Date }>>([])

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
    isNew ? null : state.snippet?.items.find((s: any) => s.id === resolvedSnippetId)
  )
  const comments = useSelector((state: any) => state.comment?.items || [])

  // Resolve tiny code to snippet ID on mount or when tinyCode changes
  useEffect(() => {
    if (tinyCode) {
      // Handle new snippet creation with tiny code
      if (tinyCode.includes('new-snippet')) {
        logger.info('Creating new snippet with share code', { tinyCode })
        setResolvedSnippetId('new')
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/join/${tinyCode}`
        setShareableUrl(shareUrl)
        setIsResolving(false)
        return
      }

      // Handle normal tiny code resolution
      if (isValidTinyCode(tinyCode)) {
        setIsResolving(true)
        setResolutionError(null)

        const resolveTinyCode = async () => {
          try {
            logger.debug('Resolving tiny code', { tinyCode })

            // Check session storage first for cached mapping
            const cached = getTinyCodeMapping(tinyCode)
            if (cached) {
              logger.info('Tiny code resolved from cache', { tinyCode, snippetId: cached })
              setResolvedSnippetId(cached)
              setIsResolving(false)
              return
            }

            // Query backend for the mapping
            const snippetId = await lookupSnippetByTinyCode(tinyCode)

            if (!snippetId) {
              const error = `Snippet not found for code: ${tinyCode}`
              logger.warn('Tiny code resolution failed', { tinyCode, error })
              setResolutionError(error)
              setIsResolving(false)
              return
            }

            // Store in session storage for future lookups
            storeTinyCodeMapping(tinyCode, snippetId)

            logger.success('Tiny code resolved successfully', { tinyCode, snippetId })
            setResolvedSnippetId(snippetId)
            setResolutionError(null)
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            logger.error('Error resolving tiny code', error, { tinyCode })
            setResolutionError(errorMsg)
          } finally {
            setIsResolving(false)
          }
        }

        resolveTinyCode()
      }
    }
  }, [tinyCode])

  useEffect(() => {
    if (!isNew && resolvedSnippetId && !tinyCode) {
      dispatch({
        type: SNIPPET_FETCH_REQUEST,
        payload: { id: resolvedSnippetId },
      } as any)
    }
  }, [resolvedSnippetId, isNew, tinyCode, dispatch])

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

  // Track user presence in the snippet
  useEffect(() => {
    // Use tinyCode for new snippets, resolvedSnippetId for existing snippets
    const presenceTrackingId = tinyCode || resolvedSnippetId
    
    if (presenceTrackingId && presenceTrackingId !== 'new') {
      // Store this user's presence in localStorage for cross-window communication
      const userId = Math.random().toString(36).substr(2, 9)
      const username = `User ${userId.substring(0, 4)}`
      
      const presenceKey = `presence_${presenceTrackingId}`
      const currentPresence = JSON.parse(localStorage.getItem(presenceKey) || '[]')
      
      // Track how many users were present before we added ourselves
      const userCountBefore = currentPresence.length
      
      // Track which users we've already shown notifications for (to avoid duplicates)
      const notifiedUserIds = new Set<string>()
      
      // Add current user if not already present
      if (!currentPresence.find((u: any) => u.id === userId)) {
        currentPresence.push({
          id: userId,
          username: username,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem(presenceKey, JSON.stringify(currentPresence))
        
        // Only show notification if there were OTHER users before we joined
        if (userCountBefore > 0) {
          console.log('Other users detected, showing their presence', { userCountBefore, otherUsers: currentPresence })
          // Show notifications for users who were already there
          currentPresence
            .filter((u: any) => u.id !== userId)
            .forEach((u: any) => {
              if (!notifiedUserIds.has(u.id)) {
                notifiedUserIds.add(u.id)
                const newUser = { id: u.id, username: u.username, timestamp: new Date(u.timestamp) }
                setUserNotifications(prev => [...prev, newUser])
              }
            })
        }
      }

      // Listen for storage changes (other windows/tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === presenceKey && e.newValue) {
          const newPresence = JSON.parse(e.newValue)
          console.log('Storage change detected', { presenceKey, newPresence })
          
          // Update active users (including ourselves)
          setActiveUsers(newPresence.map((u: any) => ({
            ...u,
            timestamp: new Date(u.timestamp)
          })))
          
          // Show notification for NEW users only (not ourselves)
          newPresence.forEach((user: any) => {
            if (user.id !== userId && !notifiedUserIds.has(user.id)) {
              notifiedUserIds.add(user.id)
              console.log('New user detected', { userId: user.id, username: user.username })
              const newUser = { id: user.id, username: user.username, timestamp: new Date(user.timestamp) }
              setUserNotifications(prev => [...prev, newUser])
            }
          })
        }
      }

      window.addEventListener('storage', handleStorageChange)
      
      // Also set initial active users (including ourselves and others)
      setActiveUsers(currentPresence.map((u: any) => ({
        ...u,
        timestamp: new Date(u.timestamp)
      })))

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        // Clean up presence on unmount
        const finalPresence = JSON.parse(localStorage.getItem(presenceKey) || '[]')
        const updatedPresence = finalPresence.filter((u: any) => u.id !== userId)
        if (updatedPresence.length > 0) {
          localStorage.setItem(presenceKey, JSON.stringify(updatedPresence))
        } else {
          localStorage.removeItem(presenceKey)
        }
        // Clear active users on unmount
        setActiveUsers([])
        setUserNotifications([])
      }
    }
  }, [tinyCode, resolvedSnippetId])

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
      let savedSnippetId = resolvedSnippetId

      if (isNew) {
        // For new snippets, dispatch create and wait for response
        const action = {
          type: SNIPPET_CREATE_REQUEST,
          payload: formData,
        }
        dispatch(action as any)

        // In a real app with proper saga handling, we'd get the ID from the result
        // For now, we'll generate a temporary share with a placeholder ID
        // The actual ID will be set by the backend
        logger.info('New snippet created', { title: formData.title })
      } else {
        dispatch({
          type: SNIPPET_UPDATE_REQUEST,
          payload: {
            id: resolvedSnippetId,
            ...formData,
          },
        } as any)
      }

      // Create a tiny code for sharing
      if (isNew && resolvedSnippetId === 'new') {
        // For new snippets, show the share dialog
        logger.info('Generating share URL for new snippet')
        const share = createSnippetShare('temp-new-snippet')
        
        // Show alert with share URL
        alert(
          `Snippet created! Share it with this URL:\n\n${share.shareableURL}\n\n` +
          'This link will be available after your snippet is saved.'
        )
      }

      // Redirect after save
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (error) {
      logger.error('Failed to save snippet', error as Error)
      alert('Failed to save snippet')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Resolution Status - Loading or Error */}
      {isResolving && (
        <div className="bg-blue-900 border-b border-blue-700 px-6 py-3 flex items-center gap-3 text-blue-200">
          <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span>Loading snippet from tiny code...</span>
        </div>
      )}

      {resolutionError && (
        <div className="bg-red-900 border-b border-red-700 px-6 py-3 flex items-center justify-between text-red-200">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{resolutionError}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm transition-colors"
          >
            Go Home
          </button>
        </div>
      )}

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
        <div className="flex items-center gap-3">
          {shareableUrl && (
            <button
              onClick={() => setShowShareModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FiCode size={18} />
              Share
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <FiSave size={18} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && shareableUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Share Snippet</h2>
            <p className="text-gray-300 mb-4">
              Share this link with others to let them view your code:
            </p>
            <div className="bg-gray-900 rounded p-4 mb-4 border border-gray-600">
              <p className="text-blue-400 font-mono text-sm break-all">{shareableUrl}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await copyToClipboard(shareableUrl)
                  logger.success('Share URL copied to clipboard')
                  alert('Share URL copied to clipboard!')
                  setShowShareModal(false)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                      'html': 'xml',
                      'css': 'css',
                      'sql': 'sql',
                      'bash': 'bash',
                      'go': 'go',
                    }
                    const lang = languageMap[formData.language] || 'javascript'
                    try {
                      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
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

      {/* User Join Bubbles - Display at bottom right */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 pointer-events-none z-50">
        {userNotifications.map((user) => (
          <UserJoinBubble
            key={`${user.id}-${user.timestamp.getTime()}`}
            notification={{
              id: user.id,
              username: user.username,
              timestamp: user.timestamp,
            }}
            onDismiss={() => {
              setUserNotifications(prev => prev.filter(u => u.id !== user.id || u.timestamp !== user.timestamp))
            }}
          />
        ))}
      </div>

      {/* Active Users Indicator - Display in header */}
      {activeUsers.length > 1 && (
        <div className="fixed top-20 right-6 bg-blue-900 border border-blue-700 rounded-lg px-4 py-3 text-blue-100 text-sm pointer-events-auto z-40">
          <div className="font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            {activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'} viewing
          </div>
          <div className="mt-1 text-xs text-blue-200">
            {activeUsers.slice(0, 3).map(u => u.username).join(', ')}
            {activeUsers.length > 3 && ` +${activeUsers.length - 3}`}
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorPage
