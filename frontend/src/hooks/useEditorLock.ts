import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Custom Hook for Editor Lock Management
 * Manages lock/unlock state and security events
 */
export function useEditorLock(snippetId: string, sessionId: string, userId: string, isOwner: boolean) {
  const [isLocked, setIsLocked] = useState(false)
  const [lockReason, setLockReason] = useState<string | null>(null)
  const [lockedAt, setLockedAt] = useState<Date | null>(null)
  const [isLoadingLock, setIsLoadingLock] = useState(false)
  const [lockError, setLockError] = useState<string | null>(null)
  const [pendingSecurityEvents, setPendingSecurityEvents] = useState<Array<any>>([])
  const location = useLocation()
  const isJoineeSession = location.pathname.startsWith('/join/')

  // Fetch lock status on mount
  useEffect(() => {
    if (snippetId && sessionId) {
      fetchLockStatus()
    }
  }, [snippetId, sessionId])

  /**
   * Fetch current lock status
   */
  const fetchLockStatus = async () => {
    try {
      const response = await fetch(
        `/api/editor/lock-status?snippetId=${snippetId}&sessionId=${sessionId}`
      )
      const data = await response.json()
      setIsLocked(data.isLocked)
      setLockReason(data.reason)
      if (data.lockedAt) {
        setLockedAt(new Date(data.lockedAt))
      }
    } catch (error) {
      console.error('[useEditorLock] Failed to fetch lock status:', error)
    }
  }

  /**
   * Lock editor (owner only)
   */
  const lockEditor = useCallback(async (reason: string = 'Editor locked by owner') => {
    if (!isOwner) {
      setLockError('Only owner can lock editor')
      return false
    }

    setIsLoadingLock(true)
    setLockError(null)

    try {
      const response = await fetch('/api/editor/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippetId,
          sessionId,
          userId,
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to lock editor')
      }

      const data = await response.json()
      setIsLocked(data.isLocked)
      setLockReason(data.lockReason)
      setLockedAt(new Date(data.lockedAt))
      
      console.log('[useEditorLock] Editor locked:', data)
      return true
    } catch (error) {
      setLockError(error instanceof Error ? error.message : 'Failed to lock editor')
      console.error('[useEditorLock] Lock failed:', error)
      return false
    } finally {
      setIsLoadingLock(false)
    }
  }, [snippetId, sessionId, userId, isOwner])

  /**
   * Unlock editor (owner only)
   */
  const unlockEditor = useCallback(async () => {
    if (!isOwner) {
      setLockError('Only owner can unlock editor')
      return false
    }

    setIsLoadingLock(true)
    setLockError(null)

    try {
      const response = await fetch('/api/editor/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippetId,
          sessionId,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to unlock editor')
      }

      const data = await response.json()
      setIsLocked(data.isLocked)
      setLockReason(null)
      
      console.log('[useEditorLock] Editor unlocked:', data)
      return true
    } catch (error) {
      setLockError(error instanceof Error ? error.message : 'Failed to unlock editor')
      console.error('[useEditorLock] Unlock failed:', error)
      return false
    } finally {
      setIsLoadingLock(false)
    }
  }, [snippetId, sessionId, userId, isOwner])

  /**
   * Record security event (unauthorized copy/paste)
   */
  const recordSecurityEvent = useCallback(async (eventType: string, description?: string) => {
    try {
      // Validate that we have numeric IDs before attempting to record to DB
      const snippetIdNum = typeof snippetId === 'string' ? parseInt(snippetId, 10) : snippetId
      const sessionIdNum = typeof sessionId === 'string' ? parseInt(sessionId, 10) : sessionId
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId

      // For new snippets with invalid IDs, we'll still send the request so the owner gets notified via WebSocket
      // The backend will handle the notification even if DB recording fails
      
      const response = await fetch('/api/editor/record-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippetId: snippetId || 'unknown',
          sessionId: sessionId || 'unknown',
          userId: userId || 'unknown',
          username: localStorage.getItem('currentUsername') || 'Unknown',
          eventType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to record security event')
      }

      const event = await response.json()
      console.log('[useEditorLock] Security event processed:', event)
      
      // Only add to pending events if it was recorded to DB
      if (event.id) {
        setPendingSecurityEvents(prev => [...prev, event])
      } else if (event.notRecordedToDb) {
        // Event wasn't recorded to DB but was broadcast to owner for notification
        console.log('[useEditorLock] Event notification sent to owner (not recorded to DB)', {
          eventType,
          username: event.username,
          reason: 'New snippet - no numeric ID yet'
        })
      }
      
      return event
    } catch (error) {
      console.error('[useEditorLock] Failed to record security event:', error)
      return null
    }
  }, [snippetId, sessionId, userId])

  /**
   * Fetch unnotified security events (for owner)
   */
  const fetchUnnotifiedEvents = useCallback(async () => {
    if (!isOwner) return

    try {
      const response = await fetch(`/api/editor/unnotified-events?snippetId=${snippetId}`)
      const events = await response.json()
      setPendingSecurityEvents(events)
      console.log('[useEditorLock] Fetched unnotified events:', events)
      return events
    } catch (error) {
      console.error('[useEditorLock] Failed to fetch unnotified events:', error)
      return []
    }
  }, [snippetId, isOwner])

  /**
   * Mark event as notified
   */
  const markEventNotified = useCallback(async (eventId: string) => {
    try {
      const response = await fetch('/api/editor/notify-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark event as notified')
      }

      // Remove from pending
      setPendingSecurityEvents(prev => prev.filter(e => e.id !== eventId))
      console.log('[useEditorLock] Event marked as notified:', eventId)
      return true
    } catch (error) {
      console.error('[useEditorLock] Failed to mark event notified:', error)
      return false
    }
  }, [])

  return {
    isLocked,
    lockReason,
    lockedAt,
    isLoadingLock,
    lockError,
    isJoineeSession,
    pendingSecurityEvents,
    lockEditor,
    unlockEditor,
    recordSecurityEvent,
    fetchUnnotifiedEvents,
    markEventNotified,
    fetchLockStatus,
  }
}
