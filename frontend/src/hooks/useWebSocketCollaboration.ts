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
  onPresenceUpdate: (users: UserPresence[]) => void,
  onCodeChange: (change: CodeChangeMessage) => void,
  onTypingUpdate: (typingUsers: Array<{ userId: string; username: string }>) => void
) {
  const hasJoinedRef = useRef<boolean>(false)
  const isConnectedRef = useRef<boolean>(false)
  const currentSnippetIdRef = useRef<string | null>(null)

  // Initialize WebSocket connection only once per component lifecycle
  useEffect(() => {
    async function initializeConnection() {
      try {
        console.log('Initializing WebSocket connection...')
        await webSocketService.connect(userId)
        isConnectedRef.current = true
        console.log('WebSocket connected successfully')
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        isConnectedRef.current = false
      }
    }

    // Only initialize if not already connected
    if (!isConnectedRef.current && userId) {
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
    if (!snippetId || !userId || !username || !isConnectedRef.current) {
      console.log('Skipping join - missing requirements', { snippetId, userId: !!userId, username, connected: isConnectedRef.current })
      return
    }

    // Prevent re-joining the same snippet on component re-renders
    if (currentSnippetIdRef.current === snippetId && hasJoinedRef.current) {
      console.log('Already joined this snippet, skipping duplicate join', { snippetId, userId })
      return
    }

    // If we're switching to a different snippet, leave the previous one first
    if (currentSnippetIdRef.current && currentSnippetIdRef.current !== snippetId) {
      console.log('Switching snippets, leaving previous', { from: currentSnippetIdRef.current, to: snippetId })
      webSocketService.leaveSnippet(currentSnippetIdRef.current, userId).catch((error) => {
        console.error('Error leaving previous snippet:', error)
      })
      hasJoinedRef.current = false
    }

    async function joinAndSubscribe() {
      try {
        console.log(`Joining snippet ${snippetId} as ${username}`)
        hasJoinedRef.current = true
        currentSnippetIdRef.current = snippetId

        // Join the session
        await webSocketService.joinSnippet(snippetId, userId, username)
        console.log(`Successfully joined snippet ${snippetId}`)

        // Subscribe to presence updates
        webSocketService.subscribeToPresence(snippetId, (message: PresenceMessage) => {
          console.log('Presence update:', message)
          onPresenceUpdate(message.activeUsers)
        })

        // Subscribe to code changes
        webSocketService.subscribeToCodeChanges(snippetId, (change: CodeChangeMessage) => {
          console.log('Code change from', change.username)
          onCodeChange(change)
        })

        // Subscribe to typing indicators
        webSocketService.subscribeToTypingStatus(snippetId, (status: TypingStatusMessage) => {
          console.log('Typing users:', status.typingUsers)
          onTypingUpdate(status.typingUsers)
        })
      } catch (error) {
        console.error('Error joining snippet:', error)
        hasJoinedRef.current = false
      }
    }

    joinAndSubscribe()

    // Cleanup on unmount or snippet change
    return () => {
      if (hasJoinedRef.current && currentSnippetIdRef.current === snippetId) {
        console.log(`Leaving snippet ${snippetId}`)
        webSocketService.leaveSnippet(snippetId, userId).catch((error) => {
          console.error('Error leaving snippet:', error)
        })
        hasJoinedRef.current = false
      }
    }
  }, [snippetId, userId, username, onPresenceUpdate, onCodeChange, onTypingUpdate])

  // Send code change
  const sendCodeChange = useCallback(
    async (code: string, language: string) => {
      if (!snippetId || !isConnectedRef.current) {
        console.warn('Cannot send code change: not connected or no snippet ID')
        return
      }

      try {
        await webSocketService.sendCodeChange(snippetId, userId, username || `User ${userId.substring(0, 4)}`, code, language)
      } catch (error) {
        console.error('Error sending code change:', error)
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

  // Get connection status
  const isConnected = useCallback(() => {
    return webSocketService.getConnectionStatus()
  }, [])

  return {
    sendCodeChange,
    sendTypingIndicator,
    isConnected,
  }
}
