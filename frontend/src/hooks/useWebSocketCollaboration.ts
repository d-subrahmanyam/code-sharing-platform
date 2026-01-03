import { useEffect, useRef, useCallback } from 'react'
import {
  webSocketService,
  type UserPresence,
  type CodeChangeMessage,
  type PresenceMessage,
  type TypingStatusMessage,
} from '../services/webSocketService'

/**
 * Custom Hook for WebSocket Collaboration
 * Handles connection, subscriptions, and message dispatching
 * Prevents duplicate joins on re-renders/refreshes
 */
export function useWebSocketCollaboration(
  snippetId: string | null | undefined,
  userId: string,
  username: string | null,
  isOwner: boolean, // Add isOwner parameter to conditionally subscribe to security events
  onPresenceUpdate: (users: UserPresence[], snippetTitle?: string, presenceMessage?: PresenceMessage) => void,
  onCodeChange: (change: CodeChangeMessage) => void,
  onTypingUpdate: (typingUsers: Array<{ userId: string; username: string }>) => void,
  onMetadataUpdate?: (metadata: any) => void,
  onStateSync?: (syncMessage: any) => void,
  onSecurityEvent?: (event: any) => void
) {
  const hasJoinedRef = useRef<boolean>(false)
  const isConnectedRef = useRef<boolean>(false)
  const currentSnippetIdRef = useRef<string | null>(null)
  const connectionAttemptedRef = useRef<boolean>(false)

  // Initialize WebSocket connection only once per component lifecycle
  useEffect(() => {
    async function initializeConnection() {
      // Ensure we only attempt once
      if (connectionAttemptedRef.current) {
        console.log('[useWebSocketCollaboration] Connection already attempted, skipping')
        return
      }
      
      connectionAttemptedRef.current = true
      
      try {
        console.log('[useWebSocketCollaboration] Initializing WebSocket connection...', { userId })
        await webSocketService.connect(userId)
        isConnectedRef.current = true
        console.log('[useWebSocketCollaboration] ✓ WebSocket connected successfully', { isConnected: isConnectedRef.current })
      } catch (error) {
        console.error('[useWebSocketCollaboration] ✗ Failed to connect to WebSocket:', error)
        isConnectedRef.current = false
      }
    }

    // Initialize connection on first render (userId is stable)
    if (userId && !connectionAttemptedRef.current) {
      console.log('[useWebSocketCollaboration] Starting connection initialization', { userId })
      initializeConnection()
    }

    return () => {
      // Don't disconnect on unmount to allow reconnection to other snippets
      // webSocketService.disconnect()
    }
  }, [userId])

  // Join snippet session and set up subscriptions
  // This effect runs when snippetId or username changes, but prevents duplicate joins for same snippetId
  useEffect(() => {
    if (!snippetId || !userId || !username) {
      console.log('[useWebSocketCollaboration] Skipping join - missing requirements', { snippetId, userId: !!userId, username })
      return
    }

    // Wait for connection to be established before joining
    if (!isConnectedRef.current && !connectionAttemptedRef.current) {
      console.log('[useWebSocketCollaboration] Connection not yet attempted, returning')
      return
    }

    // If connection was attempted but not yet established, wait a bit
    if (!isConnectedRef.current && connectionAttemptedRef.current) {
      console.log('[useWebSocketCollaboration] Waiting for connection to establish...')
      const timeout = setTimeout(() => {
        // Try again after 500ms
        console.log('[useWebSocketCollaboration] Retrying join after connection wait')
      }, 500)
      return () => clearTimeout(timeout)
    }

    // Prevent re-joining the same snippet on component re-renders
    if (currentSnippetIdRef.current === snippetId && hasJoinedRef.current) {
      console.log('[useWebSocketCollaboration] Already joined this snippet, skipping duplicate join', { snippetId, userId })
      return
    }

    // If we're switching to a different snippet, leave the previous one first
    if (currentSnippetIdRef.current && currentSnippetIdRef.current !== snippetId) {
      console.log('[useWebSocketCollaboration] Switching snippets, leaving previous', { from: currentSnippetIdRef.current, to: snippetId })
      webSocketService.leaveSnippet(currentSnippetIdRef.current, userId).catch((error) => {
        console.error('Error leaving previous snippet:', error)
      })
      hasJoinedRef.current = false
    }

    async function joinAndSubscribe() {
      try {
        console.log(`[useWebSocketCollaboration] Joining snippet ${snippetId} as ${username}`)
        hasJoinedRef.current = true
        currentSnippetIdRef.current = snippetId

        // Join the session
        await webSocketService.joinSnippet(snippetId, userId, username)
        console.log(`[useWebSocketCollaboration] ✓ Successfully joined snippet ${snippetId}`)

        // Subscribe to presence updates
        webSocketService.subscribeToPresence(snippetId, (message: PresenceMessage) => {
          console.log('[useWebSocketCollaboration] Presence update:', message)
          onPresenceUpdate(message.activeUsers, message.snippetTitle, message)
        })

        // Subscribe to code changes
        webSocketService.subscribeToCodeChanges(snippetId, (change: CodeChangeMessage) => {
          console.log('[useWebSocketCollaboration] Code change from', change.username)
          onCodeChange(change)
        })

        // Subscribe to typing indicators
        webSocketService.subscribeToTypingStatus(snippetId, (status: TypingStatusMessage) => {
          console.log('[useWebSocketCollaboration] Typing users:', status.typingUsers)
          onTypingUpdate(status.typingUsers)
        })

        // Subscribe to state sync messages (for joinee pulling current state from owner)
        webSocketService.subscribeToStateSync(snippetId, (syncMessage: any) => {
          console.log('[useWebSocketCollaboration] State sync message received:', syncMessage)
          // Pass to the callback handler if provided
          if (onStateSync) {
            onStateSync(syncMessage)
          }
        })

        // Subscribe to metadata updates
        if (onMetadataUpdate) {
          webSocketService.subscribeToMetadataUpdates(snippetId, (metadata: any) => {
            console.log('[useWebSocketCollaboration] Metadata update:', metadata)
            onMetadataUpdate(metadata)
          })
        }

        // Subscribe to security events (copy/paste attempts)
        // Only owner sessions should subscribe to receive security event notifications
        console.log('[useWebSocketCollaboration] Checking if owner and onSecurityEvent callback provided:', { isOwner, hasCallback: !!onSecurityEvent })
        if (isOwner && onSecurityEvent) {
          console.log('[useWebSocketCollaboration] ✓ Owner session - setting up security event subscription for snippetId:', snippetId)
          webSocketService.subscribeToSecurityEvents(snippetId, (event: any) => {
            console.log('[useWebSocketCollaboration] ✓✓ Security event callback INVOKED with event:', event)
            console.log('[useWebSocketCollaboration] About to call onSecurityEvent handler')
            try {
              onSecurityEvent(event)
              console.log('[useWebSocketCollaboration] ✓✓✓ Successfully called onSecurityEvent handler')
            } catch (error) {
              console.error('[useWebSocketCollaboration] ✗ Error calling onSecurityEvent handler:', error)
            }
          })
          console.log('[useWebSocketCollaboration] ✓ Subscription request sent to webSocketService')
        } else {
          if (!isOwner) {
            console.log('[useWebSocketCollaboration] ✗ Joinee session - skipping security event subscription (only owner receives these)')
          } else if (!onSecurityEvent) {
            console.log('[useWebSocketCollaboration] ✗ onSecurityEvent callback is NOT provided, skipping subscription')
          }
        }

        // Request state sync from owner - this ensures joinee gets the current state
        // even if the owner has already made changes before the joinee connected
        console.log(`[useWebSocketCollaboration] Requesting state sync for ${snippetId}`)
        try {
          await webSocketService.requestStateSync(snippetId, userId, username)
          console.log(`[useWebSocketCollaboration] ✓ State sync requested`)
        } catch (error) {
          console.error('[useWebSocketCollaboration] Error requesting state sync:', error)
        }
      } catch (error) {
        console.error('[useWebSocketCollaboration] Error joining snippet:', error)
        hasJoinedRef.current = false
      }
    }

    joinAndSubscribe()

    // Cleanup on unmount or snippet change
    return () => {
      if (hasJoinedRef.current && currentSnippetIdRef.current === snippetId) {
        console.log(`[useWebSocketCollaboration] Leaving snippet ${snippetId}`)
        webSocketService.leaveSnippet(snippetId, userId).catch((error) => {
          console.error('Error leaving snippet:', error)
        })
        hasJoinedRef.current = false
      }
    }
  }, [snippetId, userId, username, isOwner, onPresenceUpdate, onCodeChange, onTypingUpdate, onMetadataUpdate, onSecurityEvent])

  // Send code change
  const sendCodeChange = useCallback(
    async (code: string, language: string) => {
      console.log('[sendCodeChange] Called', { 
        snippetId, 
        connected: isConnectedRef.current, 
        userId, 
        username, 
        codeLength: code.length 
      })
      
      if (!snippetId) {
        console.warn('[sendCodeChange] ✗ No snippet ID')
        return
      }
      
      if (!isConnectedRef.current) {
        console.warn('[sendCodeChange] ✗ Not connected', { isConnected: isConnectedRef.current })
        return
      }

      try {
        console.log('[sendCodeChange] Sending via WebSocket', { snippetId, userId, username })
        await webSocketService.sendCodeChange(snippetId, userId, username || `User ${userId.substring(0, 4)}`, code, language)
        console.log('[sendCodeChange] ✓ Successfully sent')
      } catch (error) {
        console.error('[sendCodeChange] ✗ Error sending code change:', error)
      }
    },
    [snippetId, userId, username]
  )

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    async (isTyping: boolean) => {
      if (!snippetId || !isConnectedRef.current) {
        return
      }

      try {
        await webSocketService.sendTypingIndicator(snippetId, userId, isTyping)
      } catch (error) {
        console.error('Error sending typing indicator:', error)
      }
    },
    [snippetId, userId]
  )

  // Send metadata update
  const sendMetadataUpdate = useCallback(
    async (metadata: {
      title?: string
      description?: string
      language?: string
      tags?: string[]
    }) => {
      if (!snippetId || !isConnectedRef.current) {
        console.warn('[sendMetadataUpdate] Not connected or no snippet ID')
        return
      }

      try {
        await webSocketService.sendMetadataUpdate(snippetId, userId, metadata)
        console.log('[sendMetadataUpdate] ✓ Successfully sent')
      } catch (error) {
        console.error('Error sending metadata update:', error)
      }
    },
    [snippetId, userId]
  )

  // Get connection status
  const isConnected = useCallback(() => {
    return webSocketService.getConnectionStatus()
  }, [])

  return {
    sendCodeChange,
    sendTypingIndicator,
    sendMetadataUpdate,
    isConnected,
  }
}
