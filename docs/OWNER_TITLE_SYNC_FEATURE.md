# Owner Session Title Synchronization Feature

## Overview
This feature enables the owner session's title (set in the metadata sidebar) to be automatically transmitted to joinee sessions via WebSocket messages and stored in the Redux store.

## What Changed

### 1. WebSocket Service (`webSocketService.ts`)

**New Interface - OwnerDetails**
```typescript
export interface OwnerDetails {
  userId: string
  username: string
  owner: true
}
```

**Enhanced PresenceMessage Interface**
```typescript
export interface PresenceMessage {
  type: 'user_joined' | 'user_left'
  userId: string
  username: string
  activeUsers: UserPresence[]
  snippetTitle?: string
  ownerDetails?: OwnerDetails  // NEW: Contains owner identification
}
```

### 2. Redux Store (`actionTypes.ts` & `snippetSlice.ts`)

**New Action Type**
```typescript
export const SNIPPET_SET_TITLE_FROM_OWNER = 'SNIPPET_SET_TITLE_FROM_OWNER'
```

**New Reducer Case**
Handles updates to snippet title when received from owner:
```typescript
case SNIPPET_SET_TITLE_FROM_OWNER:
  return {
    ...state,
    currentSnippet: state.currentSnippet
      ? {
          ...state.currentSnippet,
          title: action.payload.title,
        }
      : null,
    loading: false,
  }
```

### 3. EditorPage Component (`EditorPage.tsx`)

**Presence Update Handler Enhanced**
- When `snippetTitle` is received in presence message and user is joinee:
  - Updates local `formData` state with new title
  - Dispatches `SNIPPET_SET_TITLE_FROM_OWNER` action to Redux store
  - Logs synchronization event for debugging

**Metadata Update Handler Enhanced**
- When metadata from owner includes title:
  - Updates local form state with title
  - Dispatches Redux action to persist title in store
  - Logs which changes were applied

## Data Flow

### Owner → Joinee Title Synchronization

```
Owner Session (EditorPage)
    ↓
Owner updates title in metadata sidebar
    ↓
Owner sends metadata/presence update via WebSocket
    ↓
Backend broadcasts to all session participants
    ↓
Joinee Session (EditorPage)
    ↓
Receives presence message with snippetTitle
    ↓
Updates local formData.title state
    ↓
Dispatches SNIPPET_SET_TITLE_FROM_OWNER action
    ↓
Redux Store (snippetSlice)
    ↓
Updates currentSnippet.title
    ↓
Component re-renders with new title
```

## Message Structure

### Presence Message Example
```typescript
{
  type: 'user_joined',
  userId: 'user_123abc',
  username: 'alice',
  activeUsers: [
    { userId: 'user_123abc', username: 'alice', owner: true, ... },
    { userId: 'user_456def', username: 'bob', owner: false, ... }
  ],
  snippetTitle: 'My Python Script',      // NEW
  ownerDetails: {                         // NEW
    userId: 'user_123abc',
    username: 'alice',
    owner: true
  }
}
```

## Testing Scenarios

### Scenario 1: Owner Creates Title During Session
1. Owner opens new snippet with `/join/new-snippet-XXXX`
2. Owner enters title "Hello World" in metadata sidebar
3. Owner sends metadata update
4. Joinee receives WebSocket message with `snippetTitle: "Hello World"`
5. Joinee's editor automatically displays title in metadata section
6. Joinee's Redux store contains title for persistence

### Scenario 2: Owner Changes Title Mid-Collaboration
1. Both owner and joinee in same session
2. Owner modifies title from "Hello World" to "Hello Python"
3. Metadata update sent via WebSocket
4. Joinee receives update with new title
5. Joinee sees title change in real-time
6. Redux store updated with new title

### Scenario 3: Joinee Refreshes Page
1. Joinee in active session with owner
2. Joinee refreshes page (F5)
3. Rejoins same session via URL
4. WebSocket reconnects and sends presence update
5. Presence message includes current `snippetTitle`
6. Joinee's form is populated with title from owner
7. Redux store synchronizes with current title

## Benefits

✅ **Real-time Synchronization**: Owner's title changes instantly visible to joinee
✅ **Persistence**: Title stored in Redux store persists across component re-renders
✅ **Fallback Support**: If presence title unavailable, metadata updates still synchronize
✅ **Debugging**: Console logs track title synchronization for troubleshooting
✅ **State Consistency**: Redux store provides single source of truth for title

## Implementation Details

### Dispatch Locations
1. **In Presence Handler** (lines ~365-375)
   - Called when WebSocket presence update received with `snippetTitle`

2. **In Metadata Handler** (lines ~457-463)
   - Called when metadata update from owner includes title change

### Dispatch Format
```typescript
dispatch({
  type: 'SNIPPET_SET_TITLE_FROM_OWNER',
  payload: { title: snippetTitle }
})
```

## Next Steps (Optional Enhancements)

- [ ] Sync description, tags, and language in same manner
- [ ] Add title change notifications/toast messages
- [ ] Persist title to backend when new snippet saved
- [ ] Add undo/redo for title changes
- [ ] Implement title change conflict resolution if both sides edit simultaneously

## Related Files

- [EditorPage Component](../frontend/src/pages/EditorPage.tsx) - Main component handling title sync
- [WebSocket Service](../frontend/src/services/webSocketService.ts) - Message interfaces
- [Redux Store](../frontend/src/store/) - State management
- [Snippet Slice](../frontend/src/store/slices/snippetSlice.ts) - Title reducer

## Git Commit

**Hash**: `be51525`
**Message**: Feature: Send owner session title with WebSocket presence messages to joinee sessions
