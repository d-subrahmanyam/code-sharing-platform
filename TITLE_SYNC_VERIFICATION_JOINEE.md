# Title Sync to Joinee Session - Verification Guide

## Overview
This document verifies that the title set in the owner's metadata section is properly transmitted to the joinee session via WebSocket messages.

## Implementation Details

### What Changed
1. **Backend** (`CollaborationController.java`):
   - Added owner metadata fields to `PresenceMessage` class:
     - `ownerTitle`
     - `ownerDescription`
     - `ownerLanguage`
     - `ownerTags`
   - These fields are initialized in the PresenceMessage constructor

2. **Frontend Type Definition** (`webSocketService.ts`):
   - Extended `PresenceMessage` interface to include owner metadata fields:
     ```typescript
     export interface PresenceMessage {
       // ... existing fields ...
       ownerTitle?: string
       ownerDescription?: string
       ownerLanguage?: string
       ownerTags?: string[]
     }
     ```

3. **Frontend Hook** (`useWebSocketCollaboration.ts`):
   - Updated `onPresenceUpdate` callback signature to receive full `presenceMessage`
   - Changed from: `onPresenceUpdate(users, snippetTitle)`
   - Changed to: `onPresenceUpdate(users, snippetTitle, presenceMessage)`

4. **Frontend Component** (`EditorPage.tsx`):
   - Updated presence update handler to extract and apply owner metadata
   - Added conditional logic for joinee to receive owner metadata:
     ```typescript
     if (!isOwner && presenceMessage) {
       // Apply owner metadata to joinee's formData
       setFormData(prev => {
         // Update title, description, language, tags if provided
       })
     }
     ```

## Testing Scenarios

### Scenario 1: Joinee Receives Title from Owner Session

**Setup:**
1. Owner creates new snippet at `/start/new-snippet-ABC123`
2. Owner enters title "My First App" in metadata sidebar
3. Owner sends metadata update via WebSocket
4. Joinee opens `/join/new-snippet-ABC123` in different browser/incognito

**Expected Behavior:**
- ✓ Joinee's editor displays title "My First App" in metadata section
- ✓ Console logs show "Joinee set title from owner metadata: My First App"
- ✓ Redux store contains updated title for persistence

**How to Verify:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `[WebSocket] Joinee receiving owner metadata from presence:`
4. Verify title field is populated

---

### Scenario 2: Joinee Receives Multiple Metadata Fields

**Setup:**
1. Owner has set:
   - Title: "Python Snippet"
   - Description: "A quick Python script"
   - Language: "python"
   - Tags: ["python", "quick"]
2. Joinee joins session

**Expected Behavior:**
- ✓ All metadata fields are transmitted via presence message
- ✓ Joinee receives and displays all fields
- ✓ Console shows each applied field

**How to Verify:**
1. Check presence update logs in console:
   ```
   [WebSocket] Owner Metadata from presence: {
     ownerTitle: "Python Snippet",
     ownerDescription: "A quick Python script",
     ownerLanguage: "python",
     ownerTags: ["python", "quick"]
   }
   ```
2. Verify form fields are populated with these values

---

### Scenario 3: Owner Changes Title After Joinee Joins

**Setup:**
1. Owner and joinee both in session
2. Owner changes title from "My First App" to "My Updated App"
3. Metadata update is sent via WebSocket

**Expected Behavior:**
- ✓ Joinee's title field updates in real-time
- ✓ Console shows metadata update received
- ✓ Both owner and joinee see the same title

**How to Verify:**
1. In owner's editor, change title field
2. Verify joinee's title updates immediately
3. Check console for: `[WebSocket] Metadata update received:`

---

### Scenario 4: Initial Title in Database

**Setup:**
1. Snippet already exists in database with title "Saved Snippet"
2. Joinee joins session

**Expected Behavior:**
- ✓ Joinee receives `snippetTitle` from database via presence
- ✓ If owner hasn't set new title, database title is used
- ✓ If owner has new metadata but not saved, joinee gets the new metadata

**How to Verify:**
1. Create snippet, save it, and check database
2. Have new joinee open the shared link
3. Verify title matches what's displayed

---

### Scenario 5: New Snippet (No Database Title)

**Setup:**
1. Owner creates new snippet
2. Owner enters title "New Snippet" in metadata
3. Owner shares link BEFORE saving to database
4. Joinee joins via shared link

**Expected Behavior:**
- ✓ Joinee receives title "New Snippet" via owner metadata in presence
- ✓ NOT from database (because snippet not saved yet)
- ✓ Title is available immediately when joinee joins

**How to Verify:**
1. Create new snippet without saving
2. Share the link
3. Open in new browser as joinee
4. Verify title appears immediately (from owner metadata)

---

## Console Log Verification

### Owner Sending Metadata
```
[EditorPage] Sending metadata update: title My First App
[WebSocketService.sendMetadataUpdate] Sending to: /app/snippet/ABC123/metadata {
  userId: "owner_123",
  title: "My First App",
  timestamp: 1234567890
}
```

### Joinee Receiving Metadata
```
[WebSocket] ===== PRESENCE UPDATE RECEIVED =====
[WebSocket] Owner Metadata from presence: {
  ownerTitle: "My First App",
  ownerDescription: "...",
  ownerLanguage: "javascript",
  ownerTags: [...]
}
[WebSocket] Joinee set title from owner metadata: My First App
```

---

## Backward Compatibility

- ✓ Existing presence messages still work (new fields are optional)
- ✓ Owner sessions not affected by new metadata fields
- ✓ Metadata updates still broadcast to all subscribers
- ✓ Redux store continues to work as before

---

## Related Files

- Backend: `backend/src/main/java/com/codesharing/platform/websocket/CollaborationController.java`
- Frontend Service: `frontend/src/services/webSocketService.ts`
- Frontend Hook: `frontend/src/hooks/useWebSocketCollaboration.ts`
- Frontend Component: `frontend/src/pages/EditorPage.tsx`

---

## Testing Checklist

- [ ] Owner sets title → Joinee receives via presence
- [ ] Owner changes title → Joinee updates in real-time
- [ ] Multiple metadata fields sync correctly
- [ ] Works with new snippets (not in database)
- [ ] Works with existing snippets (in database)
- [ ] Console logs show correct metadata application
- [ ] Redux store contains synchronized title
- [ ] No impact on owner session functionality
- [ ] Joinee can view but not edit owner's metadata

