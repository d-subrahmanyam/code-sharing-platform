# QUICK REFERENCE - Editor Lock Features

## 🔐 Feature Overview

### Three Main Features Implemented:

1. **Owner Lock/Unlock Editor** 
   - Owner can click button to lock the editor
   - Joinee cannot edit when locked
   
2. **Joinee Read-Only Mode**
   - Locked editor shows "Read-Only" banner
   - No editing is possible
   
3. **Copy/Paste Restrictions**
   - Ctrl+C, Ctrl+V, Ctrl+X all blocked
   - Right-click context menu blocked
   - Drag-drop blocked
   - All attempts recorded as security violations

---

## 🎮 How to Test

### Test Scenario 1: Lock/Unlock Flow
```
Owner's Browser (Tab 1):
1. Create a new snippet (click "Start New Snippet")
2. Type some code
3. Share with joinee (copy the share link)
4. See the "Lock Editor" button in the UI

Joinee's Browser (Tab 2):
1. Open the share link in new tab
2. See editor in unlocked state

Owner's Browser (Tab 1):
1. Click "Lock Editor" button
2. Button changes to show "Unlock Editor"

Joinee's Browser (Tab 2):
1. Refresh the page (or wait for WebSocket update)
2. See "Editor is locked - Read-only mode" banner
3. Try to type → nothing happens
4. Try Ctrl+C → nothing happens
```

### Test Scenario 2: Security Event Tracking
```
Setup:
- Lock the editor (from Scenario 1)

Joinee's Browser:
1. Select some code text
2. Try Ctrl+C (copy) - blocked
3. Try Ctrl+V (paste) - blocked
4. Try Ctrl+X (cut) - blocked
5. Right-click on code - context menu blocked

Owner's Browser:
1. Look for notification badge showing "1 pending event"
2. Click the badge or "View Events" button
3. See list of security violations:
   - Event type (COPY_ATTEMPT, PASTE_ATTEMPT, etc.)
   - When it happened (timestamp)
   - Who tried it (joinee's username)
4. Click "Mark as Seen" to acknowledge
5. Badge count decreases
```

### Test Scenario 3: Unlock and Resume
```
Owner's Browser:
1. See "Unlock Editor" button
2. Click it

Joinee's Browser:
1. Refresh page (or wait for WebSocket update)
2. See "Editor is unlocked - You can edit" banner
3. Try typing → code appears in editor
4. Try Ctrl+C → code is copied to clipboard ✓
```

---

## 🔧 Technical Details

### Backend Endpoints
```
GET  /api/editor/lock-status?snippetId=X&sessionId=Y
     Returns: { isLocked: true/false, reason: "..." }

POST /api/editor/lock
     Body: { snippetId, sessionId, userId, reason }
     Returns: Updated EditorLock object

POST /api/editor/unlock
     Body: { snippetId, sessionId, userId }
     Returns: Updated EditorLock object

POST /api/editor/record-event
     Body: { snippetId, sessionId, userId, username, eventType }
     Returns: Created SecurityEvent object

GET  /api/editor/unnotified-events?snippetId=X
     Returns: Array of unseen security events
```

### Frontend Components
```
EditorLockControl.tsx
├─ Status banner (locked/unlocked)
├─ Lock button (owner only)
├─ Unlock button (owner only)
└─ Pending events badge

useEditorLock.ts Hook
├─ lockEditor()
├─ unlockEditor()
├─ fetchLockStatus()
└─ recordSecurityEvent()

editorSecurity.ts
├─ preventCopy()
├─ preventPaste()
├─ preventCut()
├─ preventContextMenu()
├─ preventDragDrop()
└─ setupSecurityListeners()
```

### Database Tables
```
editor_lock
├─ id (BIGINT)
├─ snippet_id (BIGINT)
├─ session_id (BIGINT)
├─ owner_id (BIGINT)
├─ is_locked (BOOLEAN)
├─ lock_reason (VARCHAR)
├─ locked_at (TIMESTAMP)
└─ unlocked_at (TIMESTAMP)

security_events
├─ id (BIGINT)
├─ snippet_id (BIGINT)
├─ session_id (BIGINT)
├─ user_id (BIGINT)
├─ username (VARCHAR)
├─ event_type (ENUM)
├─ is_notified (BOOLEAN)
└─ created_at (TIMESTAMP)
```

---

## 📝 Code Files Modified/Created

### Backend (Java)
- ✅ EditorLockController.java - REST endpoints
- ✅ EditorLockService.java - Business logic
- ✅ SecurityEventService.java - Event tracking
- ✅ EditorLock.java - Database entity
- ✅ SecurityEvent.java - Database entity
- ✅ EditorLockRepository.java - Data access
- ✅ SecurityEventRepository.java - Data access

### Frontend (React)
- ✅ EditorLockControl.tsx - UI component
- ✅ useEditorLock.ts - State management hook
- ✅ editorSecurity.ts - Security utilities
- ✅ EditorPage.tsx - Integration (modified)
- ✅ webSocketService.ts - WebSocket (modified)

---

## ⚠️ Important Notes

1. **Lock State Not Real-Time by Default**
   - Joinee needs to refresh page to see lock state change
   - WebSocket broadcast can be added for real-time updates

2. **Owner Permission Required**
   - Only verified owner can lock/unlock
   - Backend checks ownership before allowing operation
   - Frontend conditionally shows lock button to owner only

3. **Security Events Accumulate**
   - All violation attempts are stored in database
   - Owner can review historical violations
   - Events can be marked as "seen"

4. **Copy/Paste Blocking Works**
   - Keyboard shortcuts blocked (Ctrl+C, Ctrl+V, etc.)
   - Context menu (right-click) blocked
   - Drag-and-drop blocked
   - All user-friendly alternatives are covered

---

## 🐛 Troubleshooting

### Issue: Lock button not showing
- ✓ Check if you're the owner (should be if you created the snippet)
- ✓ Check if you're viewing in the owner session (not joinee session)

### Issue: Joinee still can edit when locked
- ✓ Try refreshing joinee's browser tab
- ✓ Check if lock status is persisted in database
- ✓ Verify EditorLockControl component is rendered

### Issue: Copy/paste prevention not working
- ✓ Check browser console for errors
- ✓ Verify editorSecurity listeners are attached
- ✓ Try using keyboard shortcuts (Ctrl+C, not using browser menu)

### Issue: Security events not recorded
- ✓ Make sure editor is actually locked
- ✓ Check backend logs for security event API calls
- ✓ Verify PostgreSQL database is running

---

## 🚀 Ready for Testing!

All components are implemented and integrated. Follow the test scenarios above to verify each feature works correctly.

**Remember: Do NOT commit changes until you confirm everything works as expected.**
