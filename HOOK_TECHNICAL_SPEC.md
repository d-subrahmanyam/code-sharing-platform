# Technical Specification: useOwnerJoineeSession Hook

**Version:** 1.0  
**Date:** December 24, 2025  
**Status:** ✅ Production Ready

---

## Overview

The `useOwnerJoineeSession` hook centralizes all logic for determining whether the current user is an owner or joinee in a collaborative snippet editing session.

**File Location:** `frontend/src/hooks/useOwnerJoineeSession.ts`

---

## Function Signature

```typescript
export function useOwnerJoineeSession({
  userId: userIdProp,
  activeUsers,
  snippetOwnerId,
  isNew,
  directSnippetId,
  tinyCode,
}: {
  userId: string | null;
  activeUsers: Array<{ id: string; username: string; timestamp: Date; owner?: boolean }>;
  snippetOwnerId: string | null;
  isNew: boolean;
  directSnippetId?: string;
  tinyCode?: string;
}): {
  isOwner: boolean;
  isOwnerSession: boolean;
  isJoineeSession: boolean;
}
```

---

## Parameters

### `userId` (string | null)
**Required**  
The ID of the current user.
```typescript
userId: "user_abc123_1702903200000" | null
```

### `activeUsers` (Array)
**Required**  
List of users currently in the session.
```typescript
activeUsers: [
  {
    id: "user_abc123_1702903200000",
    username: "John",
    timestamp: Date,
    owner: true
  },
  {
    id: "user_xyz789_1702903300000",
    username: "Jane",
    timestamp: Date,
    owner: false
  }
]
```

### `snippetOwnerId` (string | null)
**Required**  
The user ID of the snippet owner (from database/websocket).
```typescript
snippetOwnerId: "user_abc123_1702903200000" | null
```

### `isNew` (boolean)
**Required**  
Whether this is a newly created snippet.
```typescript
isNew: true | false
```

### `directSnippetId` (string | undefined)
**Optional**  
The snippet ID from the URL (if accessing directly).
```typescript
directSnippetId: "snippet_id_123" | undefined
```

### `tinyCode` (string | undefined)
**Optional**  
The tiny code from the URL (if accessing via share link).
```typescript
tinyCode: "abc123" | "new-snippet-xyz" | undefined
```

---

## Return Values

### `isOwner` (boolean)
Whether the current user is the owner of the snippet.
```typescript
isOwner: true  // User can edit metadata, share, save
isOwner: false // User can only view and edit code
```

### `isOwnerSession` (boolean)
Whether the current route is `/start/...` (owner session).
```typescript
isOwnerSession: true  // User accessed via /start/:tinyCode
isOwnerSession: false // User accessed via /join/:tinyCode or /editor/:id
```

### `isJoineeSession` (boolean)
Whether the current route is `/join/...` (joinee session).
```typescript
isJoineeSession: true  // User accessed via /join/:tinyCode
isJoineeSession: false // User accessed via /start/:tinyCode or /editor/:id
```

---

## Determination Logic

The hook determines `isOwner` using a priority-based system:

### Priority 1: URL Route (HIGHEST)
```typescript
if (location.pathname.startsWith('/start/')) {
  isOwner = true    // Owner session URL
}
if (location.pathname.startsWith('/join/')) {
  isOwner = false   // Joinee session URL
}
```

**Examples:**
- `/start/abc123` → `isOwner = true`
- `/join/abc123` → `isOwner = false`
- `/editor/snippet123` → Check next priority

### Priority 2: WebSocket Active Users Owner Flag
```typescript
if (activeUsers.some(u => u.owner)) {
  const ownerUser = activeUsers.find(u => u.owner)
  if (ownerUser.id === userId) {
    isOwner = true   // Current user is marked as owner
  } else {
    isOwner = false  // Other user is marked as owner
  }
}
```

**Examples:**
- `activeUsers[0] = { id: "john123", owner: true }`
- If `userId === "john123"` → `isOwner = true`
- If `userId === "jane456"` → `isOwner = false`

### Priority 3: SnippetOwnerId Match
```typescript
if (snippetOwnerId && userId === snippetOwnerId) {
  isOwner = true
}
```

**Examples:**
- `snippetOwnerId = "john123"`, `userId = "john123"` → `isOwner = true`
- `snippetOwnerId = "john123"`, `userId = "jane456"` → Check next priority

### Priority 4: Truly New Snippet (LOWEST)
```typescript
if (isNew && !directSnippetId && !tinyCode) {
  isOwner = true
}
```

**Examples:**
- `isNew = true`, `directSnippetId = undefined`, `tinyCode = undefined`
  → User creating new snippet → `isOwner = true`
- `isNew = true`, `tinyCode = "new-snippet-xyz"`
  → Sharing new snippet → Check owner flag or ID match

### Fallback
```typescript
return false  // Default to joinee if no criteria met
```

---

## Memoization

The `isOwner` value is memoized using `useMemo` with the following dependency array:

```typescript
useMemo(() => { ... }, [
  isOwnerSession,        // Route check
  isJoineeSession,       // Route check
  activeUsers,           // WebSocket users
  userIdProp,           // Current user
  snippetOwnerId,       // Owner from DB
  isNew,                // New snippet flag
  directSnippetId,      // URL param
  tinyCode              // URL param
])
```

**Optimization:** Recalculates only when dependencies change, preventing unnecessary re-renders.

---

## Logging

The hook includes comprehensive debug logging via `console.log`:

```
═══════════════════════════════════════════
[useOwnerJoineeSession] 🔍 Owner Detection Status:
  Current User ID: user_abc123_1702903200000
  Is Owner Session (/start): true
  Is Joinee Session (/join): false
  Active Users: [
    { id: "user_abc123_1702903200000", username: "John", owner: true }
  ]
  Snippet Owner ID: user_abc123_1702903200000
  Is New Snippet: false
  Check Result: {
    hasOwnerInActiveUsers: true,
    ownerMatchesCurrentUser: true,
    snippetOwnerIdSet: true,
    snippetOwnerIdMatches: true,
    isNewSnippet: false,
    isNewAndNoDirectId: false,
    reason: 'Owner found in activeUsers'
  }
  → IS OWNER: ✓ YES (Owner found in activeUsers)
═══════════════════════════════════════════
```

**Logged on:** Every dependency change (automatically by React)

**Use Case:** Debugging owner/joinee detection issues

---

## Usage Examples

### Example 1: Owner Accessing via Share Link

```typescript
// URL: /start/abc123
const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
  userId: "user_john_123",
  activeUsers: [
    { id: "user_john_123", username: "John", timestamp: new Date(), owner: true }
  ],
  snippetOwnerId: "user_john_123",
  isNew: false,
  directSnippetId: undefined,
  tinyCode: "abc123"
})

// Result:
isOwner = true              // URL is /start → isOwner
isOwnerSession = true       // Confirmed from URL
isJoineeSession = false     // Not /join
```

### Example 2: Joinee Accessing via Share Link

```typescript
// URL: /join/abc123
const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
  userId: "user_jane_456",
  activeUsers: [
    { id: "user_john_123", username: "John", timestamp: new Date(), owner: true },
    { id: "user_jane_456", username: "Jane", timestamp: new Date(), owner: false }
  ],
  snippetOwnerId: "user_john_123",
  isNew: false,
  directSnippetId: undefined,
  tinyCode: "abc123"
})

// Result:
isOwner = false             // URL is /join → not owner
isOwnerSession = false      // Not /start
isJoineeSession = true      // URL is /join
```

### Example 3: Owner Creating New Snippet

```typescript
// URL: /
const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
  userId: "user_john_123",
  activeUsers: [],
  snippetOwnerId: "user_john_123",
  isNew: true,
  directSnippetId: undefined,
  tinyCode: undefined
})

// Result:
isOwner = true              // New snippet → owner
isOwnerSession = false      // URL doesn't start with /start
isJoineeSession = false     // URL doesn't start with /join
```

### Example 4: Owner Accessing Existing Snippet

```typescript
// URL: /editor/snippet_id_789
const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
  userId: "user_john_123",
  activeUsers: [],
  snippetOwnerId: "user_john_123",
  isNew: false,
  directSnippetId: "snippet_id_789",
  tinyCode: undefined
})

// Result:
isOwner = true              // snippetOwnerId matches userId
isOwnerSession = false      // URL doesn't start with /start
isJoineeSession = false     // URL doesn't start with /join
```

### Example 5: Joinee Accessing Existing Snippet

```typescript
// URL: /editor/snippet_id_789
const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
  userId: "user_jane_456",
  activeUsers: [],
  snippetOwnerId: "user_john_123",
  isNew: false,
  directSnippetId: "snippet_id_789",
  tinyCode: undefined
})

// Result:
isOwner = false             // snippetOwnerId doesn't match userId
isOwnerSession = false      // URL doesn't start with /start
isJoineeSession = false     // URL doesn't start with /join
```

---

## Integration with EditorPage

```typescript
import { useOwnerJoineeSession } from '../hooks/useOwnerJoineeSession'

const EditorPage: React.FC = () => {
  // ... other state
  const [activeUsers, setActiveUsers] = useState(...)
  const [snippetOwnerId, setSnippetOwnerId] = useState(...)
  
  const { isOwner, isOwnerSession, isJoineeSession } = useOwnerJoineeSession({
    userId: userId || null,
    activeUsers,
    snippetOwnerId,
    isNew,
    directSnippetId,
    tinyCode,
  })
  
  // Use in conditional rendering
  return (
    <>
      {isOwner && <MetadataSidebar />}
      {isOwner && <SaveButton />}
      {isOwner && <ShareButton />}
      {!isOwner && <ReadOnlyIndicator />}
    </>
  )
}
```

---

## Error Handling

The hook is defensive against invalid inputs:

```typescript
// Null/undefined userId
userId: null
→ All checks fail safely, returns isOwner = false

// Empty activeUsers
activeUsers: []
→ Skips WebSocket check, moves to snippetOwnerId

// Negative scenarios
snippetOwnerId: null
directSnippetId: undefined
tinyCode: undefined
isNew: false
→ Returns isOwner = false (safe default)
```

---

## Performance Considerations

- **Memoization:** Using `useMemo` prevents unnecessary recalculations
- **Dependencies:** 8 dependencies tracked for optimal updates
- **Logging:** Only logs on dependency changes (not on every render)
- **Re-renders:** Component only re-renders if hook return values change
- **Complexity:** O(n) for activeUsers search (where n is typically 2-10 users)

---

## Testing

### Unit Test Template
```typescript
describe('useOwnerJoineeSession', () => {
  // Test all 4 priority levels
  // Test edge cases
  // Test with null/undefined values
  // Test dependency changes
})
```

### Integration Test Template
```typescript
describe('useOwnerJoineeSession in EditorPage', () => {
  // Test with real navigation
  // Test with real WebSocket messages
  // Test owner UI appears/disappears correctly
})
```

---

## Future Enhancements

1. **Admin/Moderator Role:** Extend to support additional roles
2. **Permission Caching:** Cache permission decisions with invalidation
3. **Session History:** Track owner changes during session
4. **Audit Logging:** Log who changed owner role and when
5. **Hooks Testing Library:** Full unit test suite with 100% coverage

---

## Related Files

- **Component:** `frontend/src/pages/EditorPage.tsx`
- **WebSocket Service:** `frontend/src/services/webSocketService.ts`
- **Routing:** React Router v6 (location, useParams)

---

## Conclusion

The `useOwnerJoineeSession` hook provides a clean, testable, and maintainable way to determine ownership in collaborative editing sessions. It encapsulates complex logic with clear priority rules and comprehensive debugging capabilities.

**Status: Ready for production use ✅**
