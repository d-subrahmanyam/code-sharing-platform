import { useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Custom Hook for Owner/Joinee Session Determination
 * Centralizes the logic for determining if the current user is the owner or a joinee
 * 
 * Determination priority:
 * 1. URL route: /start = owner, /join = joinee (HIGHEST)
 * 2. Active users with owner flag from WebSocket
 * 3. SnippetOwnerId matching current userId
 * 4. Truly new snippets (no directSnippetId, no tinyCode)
 */
export function useOwnerJoineeSession({
  userId: userIdProp,
  activeUsers,
  snippetOwnerId,
  isNew,
  directSnippetId,
  tinyCode,
  isOwnerFlow,
}: {
  userId: string | null;
  activeUsers: Array<{ id: string; username: string; timestamp: Date; owner?: boolean }>;
  snippetOwnerId: string | null;
  isNew: boolean;
  directSnippetId?: string;
  tinyCode?: string;
  isOwnerFlow?: boolean;
}) {
  const location = useLocation()

  // Determine if this is owner (/start) or joinee (/join) session from URL
  const isOwnerSession = location.pathname.startsWith('/start/')
  const isJoineeSession = location.pathname.startsWith('/join/')

  // Determine if current user is owner
  const isOwner = useMemo(() => {
    // HIGHEST PRIORITY: Check isOwnerFlow prop (from OwnerEditorPage)
    if (isOwnerFlow) {
      return true
    }

    // HIGHEST PRIORITY: Check URL route - /start indicates owner session
    if (isOwnerSession) {
      return true
    }

    // If on /join route, definitely not owner
    if (isJoineeSession) {
      return false
    }

    // PRIMARY: Check WebSocket owner flag - highest priority when there are active users
    if (activeUsers.length > 0) {
      const activeUserOwner = activeUsers.find(u => u.owner)
      if (activeUserOwner && activeUserOwner.id === userIdProp) {
        return true
      }
      // If there are active users but none marked as owner, user is NOT owner
      if (activeUserOwner && activeUserOwner.id !== userIdProp) {
        return false
      }
    }

    // FALLBACK: Use snippetOwnerId to identify owner
    // This works both for direct access and shared code access
    // When owner accesses their own shared link, they will match snippetOwnerId
    if (snippetOwnerId && userIdProp === snippetOwnerId) {
      return true
    }

    // For truly new snippets created fresh (not via shared code), user is owner
    if (isNew && !directSnippetId && !tinyCode) {
      return true
    }

    return false
  }, [isOwnerFlow, isOwnerSession, isJoineeSession, activeUsers, userIdProp, snippetOwnerId, isNew, directSnippetId, tinyCode])

  // Debug logging for owner detection
  useEffect(() => {
    const ownerFromActiveUsers = activeUsers.find(u => u.owner)
    const ownerCheckResult = {
      hasOwnerInActiveUsers: !!ownerFromActiveUsers,
      ownerMatchesCurrentUser: ownerFromActiveUsers?.id === userIdProp,
      snippetOwnerIdSet: !!snippetOwnerId,
      snippetOwnerIdMatches: snippetOwnerId === userIdProp,
      isNewSnippet: isNew,
      isNewAndNoDirectId: isNew && !directSnippetId && !tinyCode,
      reason: '' as string,
    }

    if (ownerFromActiveUsers?.id === userIdProp) {
      ownerCheckResult.reason = 'Owner found in activeUsers'
    } else if (snippetOwnerId === userIdProp) {
      ownerCheckResult.reason = 'SnippetOwnerId matches'
    } else if (isNew && !directSnippetId && !tinyCode) {
      ownerCheckResult.reason = 'Truly new snippet'
    } else {
      ownerCheckResult.reason = 'Not owner - joinee'
    }

    console.log('═══════════════════════════════════════════')
    console.log('[useOwnerJoineeSession] 🔍 Owner Detection Status:')
    console.log('  Current User ID:', userIdProp)
    console.log('  Is Owner Session (/start):', isOwnerSession)
    console.log('  Is Joinee Session (/join):', isJoineeSession)
    console.log('  Active Users:', activeUsers.map(u => ({ id: u.id, username: u.username, owner: u.owner })))
    console.log('  Snippet Owner ID:', snippetOwnerId)
    console.log('  Is New Snippet:', isNew)
    console.log('  Check Result:', ownerCheckResult)
    console.log('  → IS OWNER:', isOwner ? '✓ YES' : '✗ NO', `(${ownerCheckResult.reason})`)
    console.log('═══════════════════════════════════════════')
  }, [userIdProp, activeUsers, snippetOwnerId, isNew, isOwner, directSnippetId, tinyCode, isOwnerSession, isJoineeSession])

  return {
    isOwner,
    isOwnerSession,
    isJoineeSession,
  }
}
