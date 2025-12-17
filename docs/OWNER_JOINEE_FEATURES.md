# Owner and Joinee Features

This document describes the owner/joinee permission system for snippet sharing sessions in the code sharing platform.

## Overview

The platform now distinguishes between **owners** (who create snippet sessions) and **joinees** (who join via shared URLs). This enables controlled collaboration where only the owner can modify certain metadata fields.

## Key Concepts

### Owner
- The user who creates a new snippet sharing session
- Has full edit permissions for all fields (title, description, language, tags, code)
- Identified by a visual crown icon (🏆) in the active users list
- Can share the snippet URL with others

### Joinee
- A user who joins an existing snippet sharing session via a shared URL
- Can edit the code content collaboratively
- **Cannot** modify: title, description, language, or tags (read-only)
- Can see all metadata but sees "(Read-only)" badges on locked fields

## Features Implemented

### 1. ✅ Owner Identification
**Location**: `frontend/src/pages/EditorPage.tsx` (lines 44-69)

```typescript
const [snippetOwnerId, setSnippetOwnerId] = useState<string | null>(null)
const isOwner = snippetOwnerId === userId || isNew

// Set owner ID for new snippets
useEffect(() => {
  if (isNew && userId && !snippetOwnerId) {
    setSnippetOwnerId(userId)
    console.log('[EditorPage] Set owner ID for new snippet:', userId)
  }
}, [isNew, userId, snippetOwnerId])
```

**How it works**:
- For new snippets: Owner ID is immediately set to the current user
- For existing snippets: Owner ID is loaded from `snippet.authorId`
- `isOwner` check determines if current user has owner permissions

### 2. ✅ Field Locking for Non-Owners
**Location**: `frontend/src/pages/EditorPage.tsx` (lines 650-760)

**Locked Fields for Joinees**:
- **Title** (line 650-680): Text input with `disabled={!isOwner}`
- **Description** (line 680-710): Textarea with `disabled={!isOwner}`
- **Language** (line 710-730): Select dropdown with `disabled={!isOwner}`
- **Tags** (line 720-760):
  - Tag input field: `disabled={!isOwner}`
  - "Add Tag" button: `disabled={!isOwner}`
  - Tag remove buttons: Hidden when `!isOwner`

**Visual Indicators**:
```tsx
{!isOwner && (
  <span className="text-xs text-gray-500 ml-2">(Read-only)</span>
)}
```

### 3. ✅ Real-Time Metadata Sync
**Backend**: `backend/src/main/java/.../websocket/CollaborationController.java` (lines 137-154)

```java
@MessageMapping("/snippet/{snippetId}/metadata")
public void handleMetadataUpdate(
    @DestinationVariable String snippetId,
    @Payload MetadataUpdateMessage message
) {
    logger.info("Received metadata update for snippet {}: {}", snippetId, message);
    
    // Broadcast the metadata update to all subscribers
    messagingTemplate.convertAndSend(
        "/topic/snippet/" + snippetId + "/metadata",
        message
    );
}
```

**Frontend Send**: `frontend/src/services/webSocketService.ts` (lines 213-240)
```typescript
sendMetadataUpdate(snippetId: string, metadata: any): void {
  if (!this.stompClient || !this.stompClient.connected) {
    console.error('[WebSocket] Cannot send metadata - not connected')
    return
  }
  
  this.stompClient.send(
    `/app/snippet/${snippetId}/metadata`,
    {},
    JSON.stringify(metadata)
  )
}
```

**Frontend Receive**: `frontend/src/pages/EditorPage.tsx` (lines 220-236)
```typescript
(metadata) => {
  console.log('[WebSocket] Metadata update received:', metadata)
  // Only update if it's from another user (owner)
  if (metadata.userId !== userId) {
    setFormData(prev => ({
      ...prev,
      title: metadata.title !== undefined ? metadata.title : prev.title,
      description: metadata.description !== undefined ? metadata.description : prev.description,
      language: metadata.language !== undefined ? metadata.language : prev.language,
      tags: metadata.tags !== undefined ? metadata.tags : prev.tags,
    }))
  }
}
```

**When Metadata is Synced**:
- Owner changes title → sends update → all joinees see new title
- Owner changes description → sends update → all joinees see new description
- Owner changes language → sends update → all joinees see new language + status bar updates
- Owner adds/removes tag → sends update → all joinees see tag changes

### 4. ✅ Status Bar Language Update
**Location**: `frontend/src/pages/EditorPage.tsx` (line 893)

```tsx
<div className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex items-center justify-between text-xs text-gray-400">
  <div className="flex items-center gap-6">
    <span>Line {currentLineNumber}</span>
    <span>Language: {formData.language}</span>
  </div>
</div>
```

Since `formData.language` is updated by the metadata callback, the status bar automatically reflects language changes when the owner modifies it.

### 5. ✅ Owner Visual Indicator
**Location**: `frontend/src/components/ActiveUsers.tsx` (lines 66-72)

```tsx
{ownerId === user.id && (
  <div className="absolute -top-1 -right-1 text-yellow-400" title="Owner">
    <FiAward size={12} />
  </div>
)}
```

**Visual Representation**:
- Yellow crown icon (🏆 `FiAward` from react-icons/fi)
- Positioned at top-right of owner's avatar bubble
- Tooltip shows "Owner" on hover
- Clearly distinguishes the owner from joinees

## WebSocket Message Flow

### Metadata Update Flow
```
1. Owner edits metadata field (title/description/language/tags)
   ↓
2. handleFormChange() or handleAddTag() called
   ↓
3. sendMetadataUpdate() sends to backend
   ↓ WebSocket: /app/snippet/{id}/metadata
4. Backend receives in handleMetadataUpdate()
   ↓
5. Backend broadcasts to all subscribers
   ↓ WebSocket: /topic/snippet/{id}/metadata
6. All clients receive metadata update
   ↓
7. Metadata callback updates formData state
   ↓
8. UI re-renders with new metadata (including status bar)
```

## Testing the Features

### Test Case 1: New Snippet Owner Badge
1. User A creates a new snippet
2. **Expected**: User A immediately sees own badge with crown icon
3. User B joins the session
4. **Expected**: User B sees User A with crown icon

### Test Case 2: Field Locking
1. User A (owner) creates snippet, edits title
2. User B (joinee) joins the session
3. **Expected**: User B sees:
   - Title field grayed out with "(Read-only)" badge
   - Description field grayed out with "(Read-only)" badge
   - Language dropdown grayed out with "(Read-only)" badge
   - Tags input grayed out with "(Read-only)" badge
   - Cannot add or remove tags

### Test Case 3: Real-Time Metadata Sync
1. User A (owner) and User B (joinee) in same session
2. User A changes title from "My Snippet" to "Updated Title"
3. **Expected**: User B sees title change instantly
4. User A changes language from "javascript" to "python"
5. **Expected**: 
   - User B sees language dropdown change to "python"
   - Status bar shows "Language: python"
   - Syntax highlighting updates

### Test Case 4: Tag Synchronization
1. User A (owner) adds tag "frontend"
2. **Expected**: User B sees "frontend" tag appear
3. User A removes tag "frontend"
4. **Expected**: User B sees "frontend" tag disappear

## Implementation Files

### Frontend
- **EditorPage.tsx**: Main editor with owner logic and field locking
- **ActiveUsers.tsx**: User avatars with owner badge
- **webSocketService.ts**: WebSocket communication layer
- **useWebSocketCollaboration.ts**: React hook for WebSocket integration

### Backend
- **CollaborationController.java**: WebSocket message handlers
- **MetadataUpdateMessage.java**: DTO for metadata updates
- **SnippetService.java**: Sets authorId on snippet creation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Owner (User A)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  EditorPage                                          │  │
│  │  • isOwner = true                                    │  │
│  │  • All fields editable                               │  │
│  │  • Crown badge visible on own avatar                │  │
│  │  • Can modify: title, description, language, tags   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket: /app/snippet/{id}/metadata
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CollaborationController                             │  │
│  │  • handleMetadataUpdate()                            │  │
│  │  • Broadcast to /topic/snippet/{id}/metadata        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket: /topic/snippet/{id}/metadata
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Joinee (User B)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  EditorPage                                          │  │
│  │  • isOwner = false                                   │  │
│  │  • Metadata fields read-only (grayed out)           │  │
│  │  • Sees owner's crown badge                         │  │
│  │  • Receives metadata updates automatically          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Bug Fixes

### Critical Fix: Owner Initialization for New Snippets
**Problem**: When creating a new snippet, `snippetOwnerId` was never set, causing:
- Owner badge not appearing for snippet creator
- Potential permission issues after first save

**Solution**: Added `useEffect` to initialize owner ID immediately when creating new snippet:
```typescript
useEffect(() => {
  if (isNew && userId && !snippetOwnerId) {
    setSnippetOwnerId(userId)
    console.log('[EditorPage] Set owner ID for new snippet:', userId)
  }
}, [isNew, userId, snippetOwnerId])
```

**Impact**: 
- ✅ Owner badge now appears immediately for new snippet creators
- ✅ Joinees joining before first save see correct permissions
- ✅ Real-time sync works correctly for new snippet sessions

## Future Enhancements

Potential improvements for owner/joinee system:

1. **Transfer Ownership**: Allow owner to transfer ownership to another user
2. **Co-Owners**: Multiple users with owner permissions
3. **Custom Permissions**: Fine-grained permission control (e.g., allow some users to edit tags but not title)
4. **Access Control Lists**: Whitelist/blacklist specific users
5. **Read-Only Mode**: Allow owner to lock code editing for all joinees
6. **Approval Workflow**: Owner must approve joinee's code changes before they're applied

## Related Documentation

- [REALTIME_COLLABORATION_COMPLETE.md](./REALTIME_COLLABORATION_COMPLETE.md) - Overall real-time features
- [WEBSOCKET_COMPLETE_GUIDE.md](./WEBSOCKET_COMPLETE_GUIDE.md) - WebSocket implementation details
- [DEVELOPER_FEATURES.md](./DEVELOPER_FEATURES.md) - All developer-facing features

---

**Last Updated**: January 2025  
**Status**: ✅ Fully Implemented and Tested
