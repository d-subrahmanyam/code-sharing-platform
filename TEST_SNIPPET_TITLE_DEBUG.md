# Testing Snippet Title in Presence Messages

## Objective
Verify that `snippetTitle` is properly populated in WebSocket presence messages when users join/leave collaborative sessions.

## Setup
Backend is running with comprehensive logging at `/topic/snippet/{snippetId}/presence`

## Test Procedure

### Step 1: Open Application (Owner)
1. Navigate to: https://localhost
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. You should see: `[WebSocket] Connected to WebSocket`

### Step 2: Create a Snippet with Title
1. Click "Create Snippet"
2. Enter title: **"Test Interview Session"** (or any meaningful title)
3. Enter some code in the editor
4. Click "Create"
5. You should see a snippet ID in the URL (e.g., `new-snippet-ABC123`)
6. Note this ID for reference

### Step 3: Share the Snippet (Get Share URL)
1. Click the "Share" button
2. Copy the generated share URL
3. Note: You should see in console logs indicating presence updates

### Step 4: Open Joinee Session (Second Browser/Tab)
1. Open a **New Tab** or **New Browser Window**
2. Paste the share URL
3. Open DevTools Console (F12)
4. You should see: `[WebSocket] Connected to WebSocket`

### Step 5: Monitor Logs
Watch the browser console for:
```
[WebSocket] Snippet Title from presence: [TITLE HERE]
```

### Step 6: Monitor Backend
In terminal, run:
```powershell
docker logs code-sharing-backend -f | Select-String "\[Collaboration\]"
```

Look for logs like:
```
[Collaboration] Starting snippet title fetch for snippetId: '[ID]'
[Collaboration] Fetched snippet: FOUND
[Collaboration] Raw title from DTO: 'Test Interview Session'
[Collaboration] Snippet title after processing: 'Test Interview Session'
[Collaboration] FINAL: Sending presence with title: 'Test Interview Session'
```

## Expected vs Actual Behavior

### Expected ✅
- Backend logs show title being fetched correctly
- `snippetTitle` field populated in PresenceMessage
- Frontend console shows: `[WebSocket] Snippet Title from presence: Test Interview Session`
- Title appears in "Joined by:" section and "Joined from:" section

### Actual ❌ (Current Issue)
- Frontend console shows: `[WebSocket] Snippet Title from presence:` (empty)
- Title shows as "Untitled Snippet" fallback
- Need to check backend logs to see where title is lost

## Key Areas to Investigate

1. **Backend Snippet Fetch**: Does `snippetService.getSnippetById()` return the correct title?
2. **PresenceMessage Creation**: Is title being passed to constructor correctly?
3. **JSON Serialization**: Are public fields being serialized by Jackson?
4. **Frontend Reception**: Is the message being received but title is empty, or is the field missing?

## Database Check

If needed, verify snippet exists in MongoDB:
```bash
docker exec code-sharing-mongodb mongosh --eval "db.code_snippets.findOne({_id: 'YOUR_SNIPPET_ID'})" --authenticationDatabase admin -u admin -p password
```

Replace `YOUR_SNIPPET_ID` with the actual snippet ID from the URL.
