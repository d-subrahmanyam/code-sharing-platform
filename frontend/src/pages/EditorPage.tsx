import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { SNIPPET_FETCH_REQUEST, SNIPPET_CREATE_REQUEST, SNIPPET_UPDATE_REQUEST } from '../store/actionTypes'
import { FiCode, FiTag, FiLock, FiEye, FiTrash2, FiSave, FiX, FiChevronLeft, FiChevronRight, FiEyeOff, FiShare2, FiCopy } from 'react-icons/fi'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { lookupSnippetByTinyCode, getTinyCodeMapping, storeTinyCodeMapping, isValidTinyCode, createSnippetShare, copyToClipboard, lookupOwnerByTinyCode } from '../utils/tinyUrl'
import { logger } from '../utils/logger'
import { ActiveUsers, type ActiveUser } from '../components/ActiveUsers'
import { UserJoinBubble } from '../components/UserJoinBubble'
import { useWebSocketCollaboration } from '../hooks/useWebSocketCollaboration'
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
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [shareableUrl, setShareableUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; username: string; timestamp: Date; owner?: boolean }>>([])
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; username: string }>>([])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [currentLineNumber, setCurrentLineNumber] = useState(1)
  const [snippetOwnerId, setSnippetOwnerId] = useState<string | null>(null)
  const [snippetOwnerUsername, setSnippetOwnerUsername] = useState<string | null>(null)
  const [userNotifications, setUserNotifications] = useState<Array<{ id: string; username: string; timestamp: Date }>>([])
  const [elapsedTime, setElapsedTime] = useState<number>(0) // Time in seconds since joining

  const [newTag, setNewTag] = useState('')
  const [currentUser] = useState(null) // In real app, get from Redux auth state
  const [usernameInput, setUsernameInput] = useState('')
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)

  // Stable userId ref for presence tracking
  // Use sessionStorage for unique session IDs (allows testing owner/joinee in same browser)
  // Falls back to localStorage for persistent identity across page refreshes within same tab
  const userIdRef = useRef<string | null>(null)
  if (!userIdRef.current) {
    // First try sessionStorage (unique per tab)
    let sessionUserId = sessionStorage.getItem('sessionUserId')
    if (sessionUserId) {
      userIdRef.current = sessionUserId
      console.log('[EditorPage] Using existing session userId:', sessionUserId)
    } else {
      // Only reuse persistent ID for truly new snippets (not accessed via shared code)
      const isTrulyNew = isNew && !directSnippetId && !tinyCode
      const persistentUserId = localStorage.getItem('persistentUserId')
      if (persistentUserId && isTrulyNew) {
        // Reuse persistent ID for owner creating new snippets
        userIdRef.current = persistentUserId
        sessionStorage.setItem('sessionUserId', persistentUserId)
        console.log('[EditorPage] Reusing persistent userId for owner:', persistentUserId)
      } else {
        // Generate new session-specific ID
        const newUserId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
        userIdRef.current = newUserId
        sessionStorage.setItem('sessionUserId', newUserId)
        // Save to localStorage for owner recognition only for truly new snippets
        if (isTrulyNew) {
          localStorage.setItem('persistentUserId', newUserId)
        }
        console.log('[EditorPage] Generated new userId:', newUserId, 'isTrulyNew:', isTrulyNew)
      }
    }
  }
  const userId = userIdRef.current

  // Determine if current user is owner
  // Priority: WebSocket owner field > local snippetOwnerId comparison > new snippet logic
  const isOwner = useMemo(() => {
    // PRIMARY: Check WebSocket owner flag - highest priority when there are active users
    if (activeUsers.length > 0) {
      const activeUserOwner = activeUsers.find(u => u.owner)
      if (activeUserOwner && activeUserOwner.id === userId) {
        return true
      }
      // If there are active users but none marked as owner, user is NOT owner
      if (activeUserOwner && activeUserOwner.id !== userId) {
        return false
      }
    }
    
    // FALLBACK: Use snippetOwnerId to identify owner
    // This works both for direct access and shared code access
    // When owner accesses their own shared link, they will match snippetOwnerId
    if (snippetOwnerId && userId === snippetOwnerId) {
      return true
    }
    
    // For truly new snippets created fresh (not via shared code), user is owner
    if (isNew && !directSnippetId && !tinyCode) {
      return true
    }
    
    return false
  }, [activeUsers, userId, snippetOwnerId, isNew, directSnippetId, tinyCode])

  // Debug logging for owner detection
  useEffect(() => {
    const ownerFromActiveUsers = activeUsers.find(u => u.owner)
    const ownerCheckResult = {
      hasOwnerInActiveUsers: !!ownerFromActiveUsers,
      ownerMatchesCurrentUser: ownerFromActiveUsers?.id === userId,
      snippetOwnerIdSet: !!snippetOwnerId,
      snippetOwnerIdMatches: snippetOwnerId === userId,
      isNewSnippet: isNew,
      isNewAndNoDirectId: isNew && !directSnippetId && !tinyCode,
      reason: '' as string
    }

    if (ownerFromActiveUsers?.id === userId) {
      ownerCheckResult.reason = 'Owner found in activeUsers'
    } else if (snippetOwnerId === userId) {
      ownerCheckResult.reason = 'SnippetOwnerId matches'
    } else if (isNew && !directSnippetId && !tinyCode) {
      ownerCheckResult.reason = 'Truly new snippet'
    } else {
      ownerCheckResult.reason = 'Not owner - joinee'
    }

    console.log('═══════════════════════════════════════════');
    console.log('[EditorPage] 🔍 Owner Detection Status:');
    console.log('  Current User ID:', userId);
    console.log('  Active Users:', activeUsers.map(u => ({ id: u.id, username: u.username, owner: u.owner })));
    console.log('  Snippet Owner ID:', snippetOwnerId);
    console.log('  Is New Snippet:', isNew);
    console.log('  Check Result:', ownerCheckResult);
    console.log('  → IS OWNER:', isOwner ? '✓ YES' : '✗ NO', `(${ownerCheckResult.reason})`);
    console.log('═══════════════════════════════════════════');
  }, [userId, activeUsers, snippetOwnerId, isNew, isOwner, directSnippetId, tinyCode])

  // Set owner ID for truly new snippets (not shared via code)
  useEffect(() => {
    if (isNew && !directSnippetId && !tinyCode && userId && !snippetOwnerId) {
      setSnippetOwnerId(userId)
      console.log('[EditorPage] Set owner ID for new snippet:', userId)
    }
  }, [isNew, directSnippetId, tinyCode, userId, snippetOwnerId])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'javascript',
    tags: [] as string[],
    isPublic: true,
  })
  
  // Username - either from localStorage (set on HomePage) or entered by user
  const [displayUsername, setDisplayUsername] = useState<string | null>(() => {
    return localStorage.getItem('currentUsername')
  })
  
  // Show username dialog only if not already set
  useEffect(() => {
    if (!displayUsername) {
      setShowUsernameDialog(true)
    }
  }, [])

  const snippet = useSelector((state: any) =>
    isNew ? null : state.snippet?.items.find((s: any) => s.id === resolvedSnippetId)
  )
  const comments = useSelector((state: any) => state.comment?.items || [])

  // Resolve tiny code to snippet ID on mount or when tinyCode changes
  useEffect(() => {
    if (tinyCode) {
      // Don't treat "new-snippet-XXXX" as new snippets
      // These are temporary share codes that need to be resolved to actual snippet IDs
      // All tiny codes should go through the normal resolution flow
      
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
              
              // Still fetch owner details from backend
              const ownerDetails = await lookupOwnerByTinyCode(tinyCode)
              if (ownerDetails) {
                setSnippetOwnerId(ownerDetails.ownerId)
                setSnippetOwnerUsername(ownerDetails.ownerUsername)
                logger.info('Fetched owner details from cache', ownerDetails)
              }
              return
            }

            // Query backend for owner details (includes snippet ID)
            const ownerDetails = await lookupOwnerByTinyCode(tinyCode)

            if (!ownerDetails || !ownerDetails.snippetId) {
              const error = `Snippet not found for code: ${tinyCode}`
              logger.warn('Tiny code resolution failed', { tinyCode, error })
              setResolutionError(error)
              setIsResolving(false)
              return
            }

            // Store owner details
            setSnippetOwnerId(ownerDetails.ownerId)
            setSnippetOwnerUsername(ownerDetails.ownerUsername)

            // Store mapping for future references
            storeTinyCodeMapping(tinyCode, ownerDetails.snippetId)
            
            // Set the ACTUAL snippet ID (not 'new')
            logger.info('Resolved tiny code to snippet ID', { tinyCode, snippetId: ownerDetails.snippetId })
            setResolvedSnippetId(ownerDetails.snippetId)
            setIsResolving(false)
          } catch (error) {
            logger.error('Error resolving tiny code', error)
            setResolutionError('Failed to resolve snippet. It may have been deleted.')
            setIsResolving(false)
          }
        }

        resolveTinyCode()
      }
    }
  }, [tinyCode, userId, displayUsername])

  // Fetch snippet data for both direct access and joinee sessions
  useEffect(() => {
    if (!isNew && resolvedSnippetId) {
      console.log('[EditorPage] Fetching snippet data...')
      setIsLoadingSnippet(true)
      dispatch({
        type: SNIPPET_FETCH_REQUEST,
        payload: { id: resolvedSnippetId },
      } as any)
    }
  }, [resolvedSnippetId, isNew, dispatch])

  useEffect(() => {
    if (snippet && !isNew) {
      console.log('[EditorPage] Loading snippet data:', {
        snippetId: snippet.id,
        authorId: snippet.authorId,
        currentUserId: userId,
        willBeOwner: snippet.authorId === userId
      })
      setFormData({
        title: snippet.title || '',
        description: snippet.description || '',
        code: snippet.code || '',
        language: snippet.language || 'javascript',
        tags: snippet.tags || [],
        isPublic: snippet.isPublic !== false,
      })
      // Set the owner ID from the snippet
      if (snippet.authorId) {
        setSnippetOwnerId(snippet.authorId)
        console.log('[EditorPage] ✓ Set snippet owner ID:', snippet.authorId)
        console.log('[EditorPage] ✓ Current user ID:', userId)
        console.log('[EditorPage] ✓ Is owner?', snippet.authorId === userId)
      }
      // Clear loading state once data is loaded
      setIsLoadingSnippet(false)
      console.log('[EditorPage] ✓ Snippet data fully loaded')
    }
  }, [snippet, isNew, userId])

  // Use WebSocket for real-time collaboration
  const collaborationId = tinyCode || resolvedSnippetId
  const notifiedUserIdsRef = useRef<Set<string>>(new Set())
  const lastPresenceUpdateRef = useRef<number>(0)
  const pendingPresenceRef = useRef<any>(null)
  const PRESENCE_DEBOUNCE_MS = 2000 // Debounce presence updates to reduce flickering
  
  const { sendCodeChange, sendTypingIndicator, sendMetadataUpdate } = useWebSocketCollaboration(
    collaborationId,
    userId,
    displayUsername,
    (users, snippetTitle) => {
      console.log('[WebSocket] ===== PRESENCE UPDATE RECEIVED =====')
      console.log('[WebSocket] Snippet Title from presence:', snippetTitle)
      console.log('[WebSocket] Raw users data:', JSON.stringify(users, null, 2))
      console.log('[WebSocket] Users array length:', users.length)
      users.forEach((u: any, idx: number) => {
        console.log(`[WebSocket] User ${idx}:`, { 
          userId: u.userId, 
          username: u.username, 
          owner: u.owner, 
          joinedAt: u.joinedAt,
          allKeys: Object.keys(u)
        })
      })
      
      // Debounce presence updates to reduce flickering
      const now = Date.now()
      const timeSinceLastUpdate = now - lastPresenceUpdateRef.current
      
      const processPresenceUpdate = () => {
        lastPresenceUpdateRef.current = Date.now()
        pendingPresenceRef.current = null
        
        const newUsers = users.map((u: any) => ({
          id: u.userId,
          username: u.username,
          timestamp: new Date(u.joinedAt),
          owner: u.owner || false,
        }))
        console.log('[WebSocket] Mapped users for state:', JSON.stringify(newUsers, null, 2))
        setActiveUsers(newUsers)
        
        // Update snippetOwnerId if we receive owner information from WebSocket
        const ownerUser = users.find((u: any) => u.owner)
        if (ownerUser && !snippetOwnerId) {
          setSnippetOwnerId(ownerUser.userId)
          setSnippetOwnerUsername(ownerUser.username)
          console.log('[WebSocket] Owner identified from presence update:', ownerUser.username)
        }
        
        // Update snippet title if provided and we're a joinee
        if (snippetTitle && !isOwner && !formData.title) {
          console.log('[WebSocket] Updating snippet title from presence:', snippetTitle)
          setFormData(prev => ({
            ...prev,
            title: snippetTitle
          }))
        }
        
        // Show notifications for new users (that we haven't seen before)
        users.forEach((user: any) => {
          if (user.userId !== userId && !notifiedUserIdsRef.current.has(user.userId)) {
            notifiedUserIdsRef.current.add(user.userId)
            console.log('[WebSocket] New user notification:', user.username, user.owner ? '(Owner)' : '(Joinee)')
            setUserNotifications(prev => [...prev, {
              id: user.userId,
              username: user.username,
              timestamp: new Date(),
            }])
          }
        })
      }
      
      if (timeSinceLastUpdate >= PRESENCE_DEBOUNCE_MS) {
        // Enough time has passed, apply immediately
        console.log('[WebSocket] Debounce: Applying immediately (', timeSinceLastUpdate, 'ms since last)')
        processPresenceUpdate()
      } else {
        // Store for later and debounce
        const delayMs = PRESENCE_DEBOUNCE_MS - timeSinceLastUpdate
        console.log('[WebSocket] Debounce: Queueing update (will apply in', delayMs, 'ms)')
        pendingPresenceRef.current = { users, processPresenceUpdate }
        
        // Clear any existing timeout
        if (pendingPresenceRef.current.timeout) {
          clearTimeout(pendingPresenceRef.current.timeout)
        }
        
        pendingPresenceRef.current.timeout = setTimeout(() => {
          console.log('[WebSocket] Debounce: Applying queued update after', delayMs, 'ms')
          if (pendingPresenceRef.current?.processPresenceUpdate) {
            pendingPresenceRef.current.processPresenceUpdate()
          }
        }, delayMs)
      }
    },
    (change) => {
      console.log('[WebSocket] Code change received:', {
        from: change.username,
        userId: change.userId,
        currentUserId: userId,
        willUpdate: change.userId !== userId,
        codeLength: change.code?.length
      })
      // Only update code if it's from another user
      if (change.userId !== userId) {
        console.log('[WebSocket] ✓ Applying code change from other user')
        setFormData(prev => ({
          ...prev,
          code: change.code,
          language: change.language,
        }))
      } else {
        console.log('[WebSocket] ✗ Ignoring own code change')
      }
    },
    (typingUsers) => {
      console.log('[WebSocket] Typing users:', typingUsers)
      // Filter out current user
      setTypingUsers(typingUsers.filter((u: any) => u.userId !== userId))
    },
    (metadata) => {
      console.log('[WebSocket] Metadata update received:', {
        userId: metadata.userId,
        currentUserId: userId,
        willUpdate: metadata.userId !== userId,
        changes: {
          title: metadata.title,
          description: metadata.description,
          language: metadata.language,
          tags: metadata.tags
        }
      })
      // Only update if it's from another user (owner)
      if (metadata.userId !== userId) {
        console.log('[WebSocket] ✓ Applying metadata changes from owner')
        setFormData(prev => ({
          ...prev,
          title: metadata.title !== undefined ? metadata.title : prev.title,
          description: metadata.description !== undefined ? metadata.description : prev.description,
          language: metadata.language !== undefined ? metadata.language : prev.language,
          tags: metadata.tags !== undefined ? metadata.tags : prev.tags,
        }))
        // Update line number based on new language if needed
        const currentLine = formData.code.split('\n').length
        setCurrentLineNumber(currentLine)
      } else {
        console.log('[WebSocket] ✗ Ignoring own metadata change')
      }
    }
  )

  // Debounce code changes for auto-save
  const codeChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }
  
  const handleCodeChange = (code: string) => {
    // Update local state immediately for responsive UI
    setFormData(prev => ({ ...prev, code }))
    
    // Calculate current line number (lines are 1-indexed)
    const currentLine = code.split('\n').length
    setCurrentLineNumber(currentLine)
    
    console.log('[Editor] Code change detected, code length:', code.length, 'line:', currentLine)
    
    // Debounce the code change broadcast and auto-save
    if (codeChangeTimeoutRef.current) {
      clearTimeout(codeChangeTimeoutRef.current)
    }
    
    codeChangeTimeoutRef.current = setTimeout(() => {
      // Send code change via WebSocket
      console.log('[Editor] Sending code change, snippetId:', collaborationId, 'userId:', userId, 'username:', displayUsername)
      sendCodeChange(code, formData.language)
      console.log('[Editor] Code change sent')
      
      // Auto-save to backend if this is an existing snippet
      if (!isNew && resolvedSnippetId && resolvedSnippetId !== 'new') {
        dispatch({
          type: SNIPPET_UPDATE_REQUEST,
          payload: {
            id: resolvedSnippetId,
            code,
            title: formData.title,
            description: formData.description,
            language: formData.language,
            tags: formData.tags,
            isPublic: formData.isPublic,
          },
        } as any)
        console.log('[Auto-save] Saving to backend:', { snippetId: resolvedSnippetId })
      }
    }, 1000) // 1 second debounce for auto-save
  }
  
  // Handle keyboard events to send typing indicator on complete line
  const handleEditorKeyDown = (e: any) => {
    // Send typing indicator when user presses Enter (complete line)
    if (e.key === 'Enter') {
      console.log('[Editor] Complete line entered, sending typing indicator')
      sendTypingIndicator(true)
      
      // Stop typing after 1 second
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current)
      }
      typingIndicatorTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false)
        console.log('[Editor] Typing indicator stopped')
      }, 1000)
    }
  }

  // Timer effect for elapsed time display
  useEffect(() => {
    if (!isNew && resolvedSnippetId) {
      // Reset timer when entering a session
      setElapsedTime(0)
      const timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [resolvedSnippetId, isNew])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (codeChangeTimeoutRef.current) {
        clearTimeout(codeChangeTimeoutRef.current)
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current)
      }
    }
  }, [])

  // Track user presence in the snippet
  useEffect(() => {
    // WebSocket handles presence tracking
    // This effect is kept for cleanup purposes
    const presenceTrackingId = tinyCode || resolvedSnippetId
    
    return () => {
      // Clear active users on unmount  
      setActiveUsers([])
      setUserNotifications([])
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

    // Send metadata update to other users if owner is making changes
    if (isOwner && ['title', 'description', 'language'].includes(name)) {
      console.log('[EditorPage] Sending metadata update:', name, value)
      sendMetadataUpdate({
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedTags = [...formData.tags, newTag.trim()]
      setFormData(prev => ({
        ...prev,
        tags: updatedTags,
      }))
      setNewTag('')
      
      // Send metadata update to other users if owner is making changes
      if (isOwner) {
        console.log('[EditorPage] Sending tag update:', updatedTags)
        sendMetadataUpdate({ tags: updatedTags })
      }
    }
  }

  const handleRemoveTag = (tag: string) => {
    const updatedTags = formData.tags.filter(t => t !== tag)
    setFormData(prev => ({
      ...prev,
      tags: updatedTags,
    }))
    
    // Send metadata update to other users if owner is making changes
    if (isOwner) {
      sendMetadataUpdate({ tags: updatedTags })
    }
  }

  const handleUsernameSubmit = () => {
    const name = usernameInput.trim()
    if (name) {
      localStorage.setItem('currentUsername', name)
      setDisplayUsername(name)
      setShowUsernameDialog(false)
      setUsernameInput('')
    }
  }

  const handleUsernameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUsernameSubmit()
    }
  }

  const handleUsernameSkip = () => {
    const defaultName = `User ${userId.substring(0, 4)}`
    localStorage.setItem('currentUsername', defaultName)
    setDisplayUsername(defaultName)
    setShowUsernameDialog(false)
    setUsernameInput('')
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
          payload: {
            ...formData,
            authorId: userId, // Include owner's userId
          },
        }
        console.log('[EditorPage] Creating snippet with authorId:', userId)
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
    <div className="min-h-screen bg-gray-900 dark:bg-black flex flex-col transition-colors">
      {/* Username Dialog */}
      {showUsernameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 dark:bg-gray-900 border-2 border-blue-500 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Enter Your Username</h2>
            <p className="text-gray-300 mb-6">Your username will be shown when you join a collaborative session</p>
            <input
              type="text"
              placeholder="Enter your username (e.g., John)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyPress={handleUsernameKeyPress}
              autoFocus
              className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUsernameSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleUsernameSkip}
                className="flex-1 px-4 py-2 bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Snippet Overlay - Full screen blocker */}
      {isLoadingSnippet && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Snippet...</h2>
            <p className="text-gray-400">Please wait while we load the snippet content and metadata</p>
          </div>
        </div>
      )}

      {/* Resolution Status - Loading or Error */}
      {isResolving && (
        <div className="bg-blue-900 dark:bg-blue-950 border-b border-blue-700 dark:border-blue-800 px-6 py-3 flex items-center gap-3 text-blue-200">
          <div className="animate-spin h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          <span>Loading snippet from tiny code...</span>
        </div>
      )}

      {resolutionError && (
        <div className="bg-red-900 dark:bg-red-950 border-b border-red-700 dark:border-red-800 px-6 py-3 flex items-center justify-between text-red-200">
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{resolutionError}</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-1 bg-red-700 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded text-sm transition-colors"
          >
            Go Home
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 dark:bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiCode size={24} className="text-blue-400" />
            {formData.title || 'Untitled Snippet'}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {/* Active Users Display */}
          <ActiveUsers users={activeUsers} ownerId={snippetOwnerId} />

          <div className="flex items-center gap-3">
            {/* Debug: Show user role */}
            {!isNew && (
              <div className={`px-3 py-1 rounded text-xs font-bold ${isOwner ? 'bg-yellow-600 text-black' : 'bg-gray-600 text-white'}`}>
                {isOwner ? '👑 OWNER' : '👤 JOINEE'}
              </div>
            )}
            {displayUsername && (
              <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {displayUsername}
              </div>
            )}
            {/* Timer Display */}
            {!isNew && elapsedTime > 0 && (
              <div className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                ⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </div>
            )}
            {/* Share and Save buttons - only for owner */}
            {isOwner && shareableUrl && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-l-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 h-10"
                >
                  <FiShare2 size={18} />
                  Share
                </button>
                <button
                  onClick={async () => {
                    await copyToClipboard(shareableUrl)
                    showToast('Link copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center border-l border-green-500 h-10"
                  title="Copy link"
                >
                  <FiCopy size={18} />
                </button>
              </div>
            )}
            {/* Save button - only for owner */}
            {isOwner && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <FiSave size={18} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
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
                  showToast('Link copied to clipboard!')
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
        {/* Sidebar - Metadata (Only shown to owner) */}
        {isOwner && (
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
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                Title
                {!isOwner && <span className="text-xs text-yellow-400">(Read-only)</span>}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
                disabled={!isOwner}
                placeholder="Snippet title"
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none ${
                  !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                Description
                {!isOwner && <span className="text-xs text-yellow-400">(Read-only)</span>}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                disabled={!isOwner}
                placeholder="What does this code do?"
                rows={4}
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                  !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <FiCode size={16} className="text-blue-400" />
                Language
                {!isOwner && <span className="text-xs text-yellow-400">(Read-only)</span>}
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleFormChange}
                disabled={!isOwner}
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none ${
                  !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                }`}
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
                {!isOwner && <span className="text-xs text-yellow-400">(Read-only)</span>}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  disabled={!isOwner}
                  placeholder="Add a tag..."
                  className={`flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm ${
                    !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  onClick={handleAddTag}
                  disabled={!isOwner}
                  className={`px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm ${
                    !isOwner ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-2 bg-blue-600 text-white text-xs px-2 py-1 rounded ${
                      !isOwner ? 'opacity-60' : ''
                    }`}
                  >
                    <FiTag size={12} />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={!isOwner}
                      className={`hover:text-gray-200 ${!isOwner ? 'cursor-not-allowed' : ''}`}
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
        )}

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
              <div className="w-full h-full overflow-auto bg-gray-900 flex" onKeyDown={handleEditorKeyDown}>
                {/* Line Numbers */}
                <div className="bg-gray-950 border-r border-gray-700 px-3 py-4 text-right text-gray-600 font-mono text-sm leading-6 overflow-hidden select-none">
                  {formData.code.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <div className="flex-1 overflow-auto">
                  <Editor
                    value={formData.code}
                    onValueChange={handleCodeChange}
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

          {/* Status Bar */}
          <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-6">
              <span>Line {currentLineNumber}</span>
              <span>Language: {formData.language}</span>
            </div>
            <div className="flex items-center gap-2">
              {typingUsers.length > 0 && (
                <span className="text-blue-400">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1"></span>
                  Editing: {typingUsers.map(u => u.username).join(', ')}
                </span>
              )}
            </div>
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 bg-green-600 text-white rounded-lg px-4 py-3 shadow-lg z-50 animate-pulse">
          {toastMessage}
        </div>
      )}

      {/* Typing Indicator - Show who is typing */}
      {typingUsers.length > 0 && (
        <div className="fixed top-40 right-6 bg-purple-900 border border-purple-700 rounded-lg px-4 py-2 text-purple-100 text-xs pointer-events-auto z-40">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-purple-200">
              {typingUsers.map(u => u.username).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorPage
