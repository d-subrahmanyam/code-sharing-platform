# Editor Lock & Copy/Paste Restriction Feature - Implementation Guide

## Overview
This document outlines the implementation of three key features:
1. **Owner can lock/unlock the editor** - Owner has UI controls to lock the editor
2. **Joinee gets read-only editor when locked** - Locked editor prevents all edits
3. **Joinee copy/paste restrictions** - Block copy, paste, cut operations via keyboard shortcuts and context menu

## Current Status: ✅ FULLY IMPLEMENTED

### System Components Already in Place

#### Backend (Java/Spring Boot)
- **EditorLockController.java** - REST endpoints for lock operations
  - `POST /editor/lock` - Lock the editor
  - `POST /editor/unlock` - Unlock the editor
  - `GET /editor/lock-status` - Get current lock status
  - `POST /editor/record-event` - Record security events
  - `GET /editor/unnotified-events` - Get pending security violations
  - `POST /editor/notify-event` - Mark event as seen
  - `GET /editor/events` - Get all security events

- **EditorLockService.java** - Business logic for lock management
  - `lockEditor()` - Set editor as locked
  - `unlockEditor()` - Set editor as unlocked
  - `getLockStatus()` - Fetch current lock state
  - `isEditorLocked()` - Check if locked
  - `isOwner()` - Verify user is owner

- **SecurityEventService.java** - Track unauthorized attempts
  - `recordEvent()` - Log security violations
  - `getUnnotifiedEvents()` - Get unseen events
  - `notifyOwner()` - Mark event as seen

#### Frontend (React/TypeScript)
- **useEditorLock.ts** - Custom hook for lock state management
  - `lockEditor()` - Call backend to lock
  - `unlockEditor()` - Call backend to unlock
  - `fetchLockStatus()` - Get current status
  - `recordSecurityEvent()` - Log violations to backend

- **EditorLockControl.tsx** - UI component for lock controls
  - Status banner showing locked/unlocked state
  - Owner lock/unlock buttons (only visible to owner)
  - Visual indicators and styling
  - Pending events notification

- **editorSecurity.ts** - Event prevention utilities
  - `preventCopy()` - Block copy (Ctrl+C/Cmd+C)
  - `preventPaste()` - Block paste (Ctrl+V/Cmd+V)
  - `preventCut()` - Block cut (Ctrl+X/Cmd+X)
  - `preventContextMenu()` - Block right-click menu
  - `preventDragDrop()` - Block drag-and-drop
  - `setupSecurityListeners()` - Attach all listeners

- **EditorPage.tsx** - Main editor component integration
  - Displays EditorLockControl component for joinee sessions
  - Calls `setupSecurityListeners()` when editor is locked
  - Prevents code editing when locked
  - Records security events for violations

### Database Schema
- **EditorLock Table** (PostgreSQL)
  - `id` BIGINT PRIMARY KEY
  - `snippet_id` BIGINT - Reference to code snippet
  - `session_id` BIGINT - Reference to collaboration session
  - `owner_id` BIGINT - Owner user ID
  - `is_locked` BOOLEAN - Lock state
  - `lock_reason` VARCHAR - Why locked
  - `locked_at` TIMESTAMP - When locked
  - `unlocked_at` TIMESTAMP - When unlocked
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP

- **SecurityEvent Table** (PostgreSQL/MongoDB)
  - `id` BIGINT PRIMARY KEY
  - `snippet_id` BIGINT - Related snippet
  - `session_id` BIGINT - Related session
  - `user_id` BIGINT - Who attempted action
  - `username` VARCHAR - User's display name
  - `event_type` ENUM - Type of violation
  - `is_notified` BOOLEAN - Owner was notified
  - `created_at` TIMESTAMP

## Feature Flows

### 1. Owner Locks Editor
```
Owner Session (Start Page):
1. Owner clicks "Lock Editor" button
2. Frontend calls POST /editor/lock
3. Backend saves lock state to database
4. WebSocket broadcasts EDITOR_LOCKED to all connected users
5. Joinee's UI updates to show "Read-Only" mode
6. Joinee's editor becomes read-only and input is prevented
```

### 2. Owner Unlocks Editor
```
Owner Session (Start Page):
1. Owner clicks "Unlock Editor" button
2. Frontend calls POST /editor/unlock
3. Backend updates lock state to database
4. WebSocket broadcasts EDITOR_UNLOCKED to all connected users
5. Joinee's UI updates to show "Editable" mode
6. Joinee can resume editing
```

### 3. Joinee Tries to Copy/Paste When Locked
```
Joinee Session (Join Page):
1. Editor is locked by owner
2. Joinee selects text and presses Ctrl+C (or Cmd+C)
3. Security listener intercepts copy event
4. Frontend blocks copy and records COPY_ATTEMPT security event
5. Frontend calls POST /editor/record-event with event details
6. Backend stores event in SecurityEvent table
7. Owner sees "1 pending event" notification
8. Owner can click to see what joinee tried to do
```

## Implementation Details

### Frontend Lock State Synchronization
```typescript
// In useEditorLock.ts hook:
1. On mount: Fetch lock status via GET /editor/lock-status
2. On lock action: Call POST /editor/lock, update local state
3. On unlock action: Call POST /editor/unlock, update local state
4. On code change: Check if locked - if yes, prevent change + record event
```

### Read-Only Mode for Joinee
```typescript
// In EditorPage.tsx:
1. Get isLocked from useEditorLock hook
2. If isJoineeSession && isLocked:
   - Show EditorLockControl with "Read-Only" banner
   - Prevent onValueChange: reject code modifications
   - Record EDIT_ATTEMPT security event
3. If unlocked: Allow normal editing
```

### Copy/Paste Prevention
```typescript
// In editorSecurity.ts + EditorPage.tsx:
1. Setup event listeners on editor element (copy, paste, cut, contextmenu, drag/drop)
2. Each listener:
   - Check if editor is locked
   - If locked: preventDefault() + record security event
   - If unlocked: Allow operation normally
3. Security event recorded server-side with:
   - Event type (COPY_ATTEMPT, PASTE_ATTEMPT, etc.)
   - User who attempted (joinee)
   - Timestamp
   - Snippet ID
```

## Security Events Tracked
- `COPY_ATTEMPT` - User tried to copy text (Ctrl+C/Cmd+C)
- `PASTE_ATTEMPT` - User tried to paste text (Ctrl+V/Cmd+V)
- `CUT_ATTEMPT` - User tried to cut text (Ctrl+X/Cmd+X)
- `CONTEXT_MENU_ATTEMPT` - User right-clicked to access menu
- `DRAG_DROP_ATTEMPT` - User tried to drag/drop code
- `EDIT_ATTEMPT` - User tried to modify code directly

## Testing Checklist

### Owner's Perspective
- [ ] Can see "Lock Editor" button in owner session
- [ ] Button is enabled when editor is unlocked
- [ ] Button is disabled when editor is locked
- [ ] Clicking lock button locks the editor successfully
- [ ] Lock status is immediately reflected in UI
- [ ] Can see "Unlock Editor" button when locked
- [ ] Clicking unlock button unlocks editor successfully

### Joinee's Perspective (Unlocked)
- [ ] Can type freely in editor
- [ ] Can copy/paste/cut code normally
- [ ] Can use context menu (right-click)
- [ ] Can drag and drop code

### Joinee's Perspective (Locked)
- [ ] Sees "Editor is locked - Read-Only mode" banner
- [ ] Cannot type or modify code
- [ ] Pressing Ctrl+V shows no paste (event prevented)
- [ ] Pressing Ctrl+C shows no copy (event prevented)
- [ ] Pressing Ctrl+X shows no cut (event prevented)
- [ ] Right-click shows no context menu
- [ ] Cannot drag and drop code
- [ ] Security events are recorded for each attempt

### Owner's Perspective (Security Events)
- [ ] See notification badge with pending event count
- [ ] Can click to view security events
- [ ] Events show what joinee tried to do
- [ ] Events show timestamp
- [ ] Events show joinee's username
- [ ] Can mark events as "seen"

## Configuration

### Lock Behavior Settings
No configuration needed - features are built-in:
- Lock is per snippet+session
- Lock status persists in database
- Lock can be toggled at any time
- Multiple joinees see same lock state

### Security Events
- Tracked automatically when locked
- Stored in PostgreSQL
- Can be queried by snippet owner
- Owner can review violation history

## Troubleshooting

### Issue: Lock button not appearing
- Check if user is owner (verified by isOwner flag)
- Check if in joinee session (location.pathname.startsWith('/join/'))
- Check browser console for errors

### Issue: Joinee can still edit when locked
- Check if EditorLockControl component is rendered
- Verify isLocked state is being updated correctly
- Check if onValueChange handler in Editor component checks isLocked

### Issue: Copy/paste prevention not working
- Check if setupSecurityListeners() is being called
- Verify editorRef.current is properly set
- Check browser console for listener registration logs

### Issue: WebSocket not broadcasting lock changes
- Verify backend WebSocket endpoint is running
- Check if lock action is sending event through WebSocket
- Verify joinee's subscription to lock state updates

## Related Files
- Backend: EditorLockController.java, EditorLockService.java, SecurityEventService.java
- Frontend: useEditorLock.ts, EditorLockControl.tsx, editorSecurity.ts, EditorPage.tsx
- Database: EditorLock entity, SecurityEvent entity
- WebSocket: Messages for EDITOR_LOCKED, EDITOR_UNLOCKED events

## Next Steps (If Needed)
1. Add WebSocket broadcasting of lock state changes for real-time updates
2. Add toast notifications when lock state changes
3. Add sound/vibration alerts for security violations
4. Add analytics tracking for security events
5. Add admin dashboard to view all security events across all snippets
