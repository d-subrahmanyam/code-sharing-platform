# Owner Identification and Icon Distinction Implementation

## Overview
This document describes the implementation of owner identification and icon distinction features for the code-sharing platform. When a joinee joins a snippet session using the shared tiny-URL code, the system now distinguishes between the owner and joinees, displaying respective icon markers.

## Changes Made

### 1. Backend Changes

#### 1.1 SnippetService.java
**New Method Added:** `getOwnerDetailsByTinyCode(String tinyCode)`

```java
/**
 * Get owner details by tiny code
 * Returns owner user ID and username
 *
 * @param tinyCode The 6-character tiny code
 * @return Map with snippetId, ownerId, and ownerUsername, or null if not found
 */
public Map<String, String> getOwnerDetailsByTinyCode(String tinyCode)
```

**Features:**
- Queries the `TinyUrl` table using the provided tiny code
- Checks if the URL has expired and returns null if expired
- Retrieves the owner's username from the `User` repository
- Returns a Map containing:
  - `snippetId`: The actual snippet ID
  - `ownerId`: The user ID of the owner (from TinyUrl.userId)
  - `ownerUsername`: The username of the owner
  - `tinyCode`: The tiny code itself

#### 1.2 SnippetController.java
**Modified Endpoint:** `GET /api/snippets/lookup/{tinyCode}`

**Previous Response:**
```json
{
  "snippetId": "snippet-id",
  "id": "snippet-id"
}
```

**New Response:**
```json
{
  "snippetId": "snippet-id",
  "ownerId": "user-id",
  "ownerUsername": "John",
  "tinyCode": "ABC123"
}
```

The endpoint now returns complete owner information alongside the snippet ID, eliminating the need for multiple API calls.

### 2. Frontend Changes

#### 2.1 tinyUrl.ts Utility
**New Interface Added:** `OwnerDetails`

```typescript
export interface OwnerDetails {
  snippetId: string
  ownerId: string
  ownerUsername: string
  tinyCode: string
}
```

**New Function Added:** `lookupOwnerByTinyCode(tinyCode: string): Promise<OwnerDetails | null>`

This function:
- Queries the enhanced `/lookup/{tinyCode}` endpoint
- Returns the complete owner details including username
- Handles errors gracefully with proper error logging

#### 2.2 EditorPage.tsx
**New State Variables Added:**
```typescript
const [snippetOwnerId, setSnippetOwnerId] = useState<string | null>(null)
const [snippetOwnerUsername, setSnippetOwnerUsername] = useState<string | null>(null)
```

**Modified Tiny Code Resolution Logic:**
- Updated to use `lookupOwnerByTinyCode()` instead of just `lookupSnippetByTinyCode()`
- When a joinee joins via tiny code, both owner ID and username are now stored
- The stored owner information is used throughout the session to display appropriate icons
- Added logging to track owner details retrieval

**Changes in tiny code resolution flow:**
1. When a user accesses `/join/:tinyCode`:
   - The system calls `lookupOwnerByTinyCode(tinyCode)`
   - Owner information is extracted and stored in state
   - The snippet ID is resolved for content loading
   - All subsequent operations know who the owner is

#### 2.3 ActiveUsers.tsx Component
**Enhanced Functionality:**

The component now displays:
- User avatars with initials (existing feature)
- **NEW:** Owner badge with crown icon (👑) and "Owner" label
- **NEW:** Enhanced tooltip showing full username and owner status
- Better visual distinction for the owner with a highlighted badge

**Visual Changes:**
```tsx
{ownerId === user.id && (
  <div
    className="absolute -top-1 -right-1 text-yellow-400 flex items-center justify-center bg-gray-900 rounded-full p-0.5"
    title={`${user.username} (Owner)`}
  >
    <FiAward size={12} />
  </div>
)}

{/* Tooltip with full username and owner status */}
<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
  {user.username}
  {ownerId === user.id && <span className="ml-1 text-yellow-400">👑 Owner</span>}
</div>
```

#### 2.4 UserJoinBubble.tsx Component
**Enhanced Notification Display:**

The component now:
- Shows different icons for owner vs. joinee
  - Owner: `FiAward` (crown/award icon) in yellow
  - Joinee: `FiUser` in green
- Displays "Owner" badge when the joining user is the owner
- Shows different messages:
  - Owner: "Started a session"
  - Joinee: "Joined the session"

**Updated Interface:**
```typescript
interface UserJoinNotification {
  id: string
  username: string
  timestamp: Date
  isOwner?: boolean  // NEW: Optional flag to indicate owner status
}
```

### 3. Data Flow

```
User joins via /join/:tinyCode
         ↓
EditorPage.tsx receives tinyCode from URL params
         ↓
lookupOwnerByTinyCode(tinyCode) API call
         ↓
Backend: /api/snippets/lookup/{tinyCode}
         ↓
Backend returns: { snippetId, ownerId, ownerUsername, tinyCode }
         ↓
EditorPage stores: snippetOwnerId, snippetOwnerUsername in state
         ↓
Pass ownerId to ActiveUsers and other components
         ↓
Components display appropriate icons and badges
```

### 4. Storage of Owner Information

The owner information is stored at multiple levels for reliability:

#### SessionStorage (Temporary)
- Tiny code mappings are cached in sessionStorage for quick lookups
- Prevents redundant API calls during the same session

#### Component State
- `snippetOwnerId`: Used for determining owner in logic
- `snippetOwnerUsername`: Used for display purposes

#### Backend Database
- `TinyUrl` entity stores the owner's userId
- This is the source of truth for owner identification

## Use Cases Now Supported

### 1. Owner Creating a New Snippet
✓ Owner ID is automatically set when they create the snippet
✓ Other users joining via tiny code can identify the owner

### 2. Joinee Joining via Tiny URL
✓ System fetches owner information from backend
✓ Owner badge is displayed on the owner's avatar
✓ Join notification shows owner status (if applicable)

### 3. Multiple Collaborators
✓ Owner is clearly distinguished from other collaborators
✓ All active users are displayed with appropriate icons
✓ Tooltips show full username with owner status

## Backward Compatibility

All changes are fully backward compatible:

- The `lookupSnippetByTinyCode()` function still exists and works
- Existing code using the old function will continue to work
- The enhanced endpoint returns additional data, but the original fields remain
- The `ownerId` field is optional for existing clients that don't use it

## Testing Recommendations

### Unit Tests
1. Test `getOwnerDetailsByTinyCode()` with valid and invalid codes
2. Test expired tiny URL handling
3. Test owner username retrieval

### Integration Tests
1. Create a snippet and share via tiny URL
2. Join with a different user via the tiny URL
3. Verify owner badge appears on the correct user
4. Verify join notification shows owner status

### Manual Testing
1. Open two browser tabs/windows with different user identities
2. Create a snippet in tab 1 (owner)
3. Share the tiny URL code
4. Join with tab 2 (joinee)
5. Verify:
   - Owner badge appears on owner's avatar in "Active Users"
   - Tooltip shows owner status
   - Join notification (if shown) indicates owner vs. joinee
   - Icon markers are distinct (award/crown for owner)

## Files Modified

### Backend
- `backend/src/main/java/com/codesharing/platform/service/SnippetService.java`
- `backend/src/main/java/com/codesharing/platform/controller/SnippetController.java`

### Frontend
- `frontend/src/utils/tinyUrl.ts`
- `frontend/src/pages/EditorPage.tsx`
- `frontend/src/components/ActiveUsers.tsx`
- `frontend/src/components/UserJoinBubble.tsx`

## Build Status

✅ Backend compiles successfully (Java compilation with Maven)
✅ Frontend TypeScript compilation successful
✅ No breaking changes introduced
✅ All existing functionality preserved

## Future Enhancements

1. **Owner Permissions**: Restrict certain operations to owner only
2. **Owner Indication in UI**: Add "Owner" label next to snippet title
3. **Role-Based Access**: Implement different permission levels
4. **Owner Change**: Allow owner to transfer ownership to another user
5. **Owner History**: Track owner changes in snippet audit log

## Notes

- The system currently identifies the owner based on the user ID stored in the TinyUrl table
- Owner username is fetched from the User repository, with fallback to "Unknown" if not found
- The distinction between owner and joinee is visual only (for now); functional role-based access can be added later
- All timestamps are already tracked, making it easy to add owner change history in the future
